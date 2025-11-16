import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Joystick, isHost, setState } from "playroomkit";
import {
  Billboard,
  Text,
  CameraControls,
  type CameraControls as CameraControlsType,
} from "@react-three/drei";
import {
  CapsuleCollider,
  RigidBody,
  vec3,
  type RapierRigidBody,
} from "@react-three/rapier";
import { v4 as uuidv4 } from "uuid";

import { Soldier } from "./characters";

import type { BodyUserData } from "../types";
import type { Group, DirectionalLight } from "three";

interface ControllerProps {
  state: any;
  joystick: Joystick;
  userPlayer: boolean;
  onFire: (newBullet: Record<string, any>) => void;
  onKilled: (_victim: number, killer: number) => void;
  downgradedPerformance: boolean;
  [key: string]: any;
}

const MOVEMENT_SPEED = 202;
const FIRE_RATE = 380;
export const WEAPON_OFFSET = {
  x: -0.2,
  y: 1.4,
  z: 0.8,
};

const CharacterController: React.FC<ControllerProps> = ({
  state,
  joystick,
  userPlayer,
  onFire,
  onKilled,
  downgradedPerformance,

  ...props
}) => {
  const [animation, setAnimation] = useState("Ideal");
  const [weapon, _] = useState("AK");

  const group = useRef<Group>(null!);
  const character = useRef<Group>(null!);
  const rigidBodyRef = useRef<RapierRigidBody>(null!);
  const directionalLightRef = useRef<DirectionalLight>(null!);

  const controlsRef = useRef<CameraControlsType>(null!);
  const lastShootRef = useRef(0);

  const scene = useThree((state) => state.scene);
  const spawnRandomly = () => {
    const spawns = [];
    for (let i = 0; i < 1000; i++) {
      const spawn = scene.getObjectByName(`spawn_${i}`);
      if (spawn) {
        spawns.push(spawn);
      } else {
        break;
      }
    }

    const spawnPos = spawns[Math.floor(Math.random() * spawns.length)].position;
    rigidBodyRef.current?.setTranslation(spawnPos, true);
  };

  useEffect(() => {
    if (isHost()) {
      spawnRandomly();
    }
  }, []);

  useEffect(() => {
    if (state.state.dead) {
      const audio = new Audio("/audios/dead.mp3");
      audio.volume = 0.5;
      audio.play();
    }
  }, [state.state.dead]);

  useEffect(() => {
    if (state.state.health < 100) {
      const audio = new Audio("/audios/hurt.mp3");
      audio.volume = 0.4;
      audio.play();
    }
  }, [state.state.health]);

  useFrame((_, delta) => {
    // Camera Follow Character
    if (controlsRef.current) {
      const cameraDistanceY = window.innerWidth < 1024 ? 16 : 20;
      const cameraDistanceZ = window.innerWidth < 1024 ? 12 : 16;

      // Convert rapier physics to threeJS physics
      const playerWorldPos = vec3(rigidBodyRef.current?.translation());
      controlsRef.current.setLookAt(
        playerWorldPos.x,
        playerWorldPos.y + (state.state.dead ? 12 : cameraDistanceY),
        playerWorldPos.z + (state.state.dead ? 2 : cameraDistanceZ),
        playerWorldPos.x,
        playerWorldPos.y + 1.5,
        playerWorldPos.z,
        true
      );
    }

    if (state.state.dead) {
      setAnimation("Death");
      return;
    }

    // Update player position based on joystick state
    const angle = joystick.angle();
    if (joystick.isJoystickPressed() && angle) {
      setAnimation("Run");
      character.current.rotation.y = angle;

      // Move character in its own direction
      const impulse = {
        x: Math.sin(angle) * MOVEMENT_SPEED * delta,
        y: 0,
        z: Math.cos(angle) * MOVEMENT_SPEED * delta,
      };

      rigidBodyRef.current?.applyImpulse(impulse, true);
    } else {
      setAnimation("Idle");
    }

    // Fire Func.
    if (joystick.isPressed("fire")) {
      setAnimation(
        joystick.isJoystickPressed() && angle ? "Run_Shoot" : "Idle_Shoot"
      );

      if (isHost()) {
        if (Date.now() - lastShootRef.current > FIRE_RATE) {
          lastShootRef.current = Date.now();

          const newBullet = {
            id: `${state.id}-${uuidv4()}`,
            position: vec3(rigidBodyRef.current?.translation()),
            angle,
            player: state.id,
          };

          onFire(newBullet);
        }
      }
    }

    if (isHost()) {
      state.setState("pos", rigidBodyRef.current?.translation());
    } else {
      const pos = state.getState("pos");
      if (pos) {
        rigidBodyRef.current?.setTranslation(pos, true);
      }
    }
  });

  useEffect(() => {
    if (character.current && userPlayer) {
      directionalLightRef.current.target = character.current;
    }
  }, [character.current]);

  return (
    <group ref={group} {...props}>
      {/* Auto Camera Rotate */}
      {userPlayer && <CameraControls ref={controlsRef} />}

      <RigidBody
        ref={rigidBodyRef}
        colliders={false} // Remove default colliders
        linearDamping={12} // Friction
        lockRotations
        type={isHost() ? "dynamic" : "kinematicPosition"} // Physics simulation is not deterministic across clients — each device runs its own version of the world
        onIntersectionEnter={(e) => {
          // On Collide Handler
          const other = e.other.rigidBody?.userData as BodyUserData;

          if (isHost() && other.type === "bullet" && state.state.health > 0) {
            const newHealth = state.state.health - other.damage;
            if (newHealth <= 0) {
              setState("deaths", state.state.deaths + 1);
              setState("dead", true);
              setState("health", 0);
              rigidBodyRef.current.setEnabled(false);

              setTimeout(() => {
                spawnRandomly();
                rigidBodyRef.current.setEnabled(true);
                setState("health", 100);
                setState("dead", false);
              }, 2000);

              onKilled(state.id, other.userData.player);
            } else {
              setState("health", newHealth);
            }
          }
        }}
      >
        <PlayerInfo state={state.state} />
        <group ref={character}>
          <Soldier
            color={state.state.profile?.color}
            animation={animation}
            weapon={weapon}
          />
          {userPlayer && (
            <Crosshair
              position={[WEAPON_OFFSET.x, WEAPON_OFFSET.y, WEAPON_OFFSET.z]}
            />
          )}
        </group>

        {userPlayer && (
          <directionalLight
            ref={directionalLightRef}
            position={[25, 18, -25]}
            intensity={0.3}
            castShadow={!downgradedPerformance} // Disable shadows on low-end devices
            shadow-camera-near={0}
            shadow-camera-far={100}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-bias={-0.0001}
          />
        )}

        <CapsuleCollider args={[0.7, 0.6]} position={[0, 1.28, 0]} />
      </RigidBody>
    </group>
  );
};

const Crosshair: React.FC<
  { position: [number, number, number] } & Record<string, any>
> = ({ position, ...props }) => {
  return (
    <group position={position} {...props}>
      <mesh position-z={1}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color="black" transparent opacity={0.9} />
      </mesh>
      <mesh position-z={2}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color="black" transparent opacity={0.85} />
      </mesh>
      <mesh position-z={3}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color="black" transparent opacity={0.8} />
      </mesh>

      <mesh position-z={4.5}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color="black" opacity={0.7} transparent />
      </mesh>

      <mesh position-z={6.5}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color="black" opacity={0.6} transparent />
      </mesh>

      <mesh position-z={9}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color="black" opacity={0.2} transparent />
      </mesh>
    </group>
  );
};

const PlayerInfo: React.FC<{ state: any }> = ({ state }) => {
  const health = state.health;
  const name = state.profile.name;

  return (
    <Billboard position-y={2.5}>
      <Text position-y={0.36} fontSize={0.4}>
        {name}
        <meshBasicMaterial color={state.profile.color} />
      </Text>

      <mesh position-z={-0.1}>
        <planeGeometry args={[1, 0.2]} />
        <meshBasicMaterial color="black" transparent opacity={0.5} />
      </mesh>
      <mesh scale-x={health / 100} position-x={-0.5 * (1 - health / 100)}>
        <planeGeometry args={[1, 0.2]} />
        <meshBasicMaterial color="red" />
      </mesh>
    </Billboard>
  );
};

export default CharacterController;
