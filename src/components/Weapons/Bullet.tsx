import { useEffect, useRef } from "react";
import { RigidBody, type RapierRigidBody, vec3 } from "@react-three/rapier";
import { isHost } from "playroomkit";
import { MeshBasicMaterial, type Vector3 } from "three";

import type { BodyUserData } from "../../types";
import { WEAPON_OFFSET } from "../CharacterController";

const BULLET_SPEED = 20;
const bulletMaterial = new MeshBasicMaterial({
  color: "hotpink",
  toneMapped: false,
});
bulletMaterial.color.multiplyScalar(42);

const Bullet: React.FC<{
  player: any;
  angle: number;
  position: any;
  onHit: (position: Vector3) => void;
}> = ({ player, angle, position, onHit }) => {
  const rigidBodyRef = useRef<RapierRigidBody>(null!);

  useEffect(() => {
    const velocity = {
      x: Math.sin(angle) * BULLET_SPEED,
      y: 0,
      z: Math.cos(angle) * BULLET_SPEED,
    };

    rigidBodyRef.current?.setLinvel(velocity, true);

    const audio = new Audio("/audios/rifle.mp3");
    audio.play();
  }, []);

  return (
    <group position={[position.x, position.y, position.z]} rotation-y={angle}>
      <group
        position-x={WEAPON_OFFSET.x}
        position-y={WEAPON_OFFSET.y}
        position-z={WEAPON_OFFSET.z}
      >
        <RigidBody
          userData={{ type: "bullet", player, damage: 10 }}
          ref={rigidBodyRef}
          gravityScale={0}
          sensor // Notify when it collide
          onIntersectionEnter={(e) => {
            // On Collide Handler
            const other = e.other.rigidBodyObject?.userData as BodyUserData;

            if (isHost() && other.type !== "bullet") {
              rigidBodyRef.current.setEnabled(false);
              onHit(vec3(rigidBodyRef.current?.translation()));
            }
          }}
        >
          <mesh position-z={0.25} material={bulletMaterial} castShadow>
            <boxGeometry args={[0.05, 0.05, 0.5]} />
          </mesh>
        </RigidBody>
      </group>
    </group>
  );
};

export default Bullet;
