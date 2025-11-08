import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Joystick, isHost } from "playroomkit";
import {
  CameraControls,
  type CameraControls as CameraControlsType,
} from "@react-three/drei";
import {
  CapsuleCollider,
  RigidBody,
  vec3,
  type RapierRigidBody,
} from "@react-three/rapier";

import { Soldier } from "./characters";

import type { Group } from "three";

interface ControllerProps {
  state: any;
  joystick: Joystick;
  userPlayer: boolean;
  [key: string]: any;
}

const MOVEMENT_SPEED = 200;

const CharacterController: React.FC<ControllerProps> = ({
  state,
  joystick,
  userPlayer,
  ...props
}) => {
  const [animation, setAnimation] = useState("Ideal");
  const group = useRef<Group>(null!);
  const character = useRef<Group>(null!);
  const controlsRef = useRef<CameraControlsType>(null!);
  const rigidBodyRef = useRef<RapierRigidBody>(null!);

  useFrame((_, delta) => {
    // Camera Follow Character
    if (controlsRef.current) {
      const cameraDistanceY = window.innerWidth < 1024 ? 16 : 20;
      const cameraDistanceZ = window.innerWidth < 1024 ? 12 : 16;

      // Conver rapier physics to threeJS physics
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

    if (isHost() && rigidBodyRef.current) {
      state.setState("pos", rigidBodyRef.current.translation());
    } else {
      const pos = state.getState("pos");
      if (pos) {
        rigidBodyRef.current?.setTranslation(pos, true);
      }
    }
  });

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
      >
        <group ref={character}>
          <Soldier color={state.state.profile?.color} animation={animation} />
        </group>
        <CapsuleCollider args={[0.7, 0.6]} position={[0, 1.28, 0]} />
      </RigidBody>
    </group>
  );
};

export default CharacterController;
