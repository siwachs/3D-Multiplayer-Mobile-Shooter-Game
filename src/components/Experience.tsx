import { useEffect, useState } from "react";
import { Environment } from "@react-three/drei";
import {
  insertCoin,
  isHost,
  Joystick,
  myPlayer,
  onPlayerJoin,
  useMultiplayerState,
} from "playroomkit";

import { BattleGround } from "./environment";
import { Bullet } from "./Weapons";
import CharacterController from "./CharacterController";
import { BulletHit } from "./BulletHit";

import type { Player, Position } from "../types";

export const Experience: React.FC<{
  downgradedPerformance?: boolean;
}> = ({ downgradedPerformance = false }) => {
  const [players, setPlayers] = useState<Player[]>([]);

  const [bullets, setBullets] = useState<Record<string, any>[]>([]);
  const [networkBullets, setNetworkBullets] = useMultiplayerState<
    Record<string, any>[]
  >("bullets", []);

  const [hits, setHits] = useState<Record<string, any>[]>([]);
  const [networkHits, setNetworkHits] = useMultiplayerState<
    Record<string, any>[]
  >("hits", []);

  useEffect(() => {
    setNetworkBullets(bullets);
  }, [bullets]);

  useEffect(() => {
    setNetworkHits(hits);
  }, [hits]);

  const start = async () => {
    await insertCoin();

    const setUpPlayer = (state: Player["state"]) => {
      const joystick = new Joystick(state, {
        type: "angular",
        buttons: [{ id: "fire", label: "Fire" }],
      });

      state.setState("health", 100);
      state.setState("deaths", 0);
      state.setState("kills", 0);

      const newPlayer: Player = { state, joystick };
      setPlayers((prev) => [...prev, newPlayer]);

      state.onQuit(() => {
        setPlayers((players) => players.filter((p) => p.state.id !== state.id));
      });
    };

    onPlayerJoin((state) => setUpPlayer(state));
  };

  useEffect(() => {
    start();
  }, []);

  const onFire = (bullet: Record<string, any>) => {
    setBullets((bullets) => [...bullets, bullet]);
  };

  const onKilled = (_victim: number, killer: number) => {
    const killerState = players.find((p) => p.state.id === killer)?.state;
    killerState.setState("kills", killerState.scale.kills + 1);
  };

  const onHit = (bulletId: string, position?: Position) => {
    setBullets((bullets) => {
      // Double-check the bullet still exists before removing
      if (bullets.some((b) => b.id === bulletId)) {
        return bullets.filter((bullet) => bullet.id !== bulletId);
      }
      return bullets;
    });

    setHits((hits) => {
      // Prevent duplicate hits
      if (!hits.some((h) => h.id === bulletId)) {
        return [...hits, { id: bulletId, position }];
      }
      return hits;
    });
  };

  const onHitEnded = (hitId: string) => {
    setHits((hits) => hits.filter((h) => h.id !== hitId));
  };

  return (
    <>
      {/* <directionalLight
        position={[25, 18, -25]}
        intensity={0.3}
        castShadow
        shadow-camera-near={0}
        shadow-camera-far={80}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-bias={-0.0001}
      /> */}
      <BattleGround />
      {players.map(({ state, joystick }) => (
        <CharacterController
          key={state.id}
          state={state}
          joystick={joystick}
          userPlayer={state.id === myPlayer()?.id}
          onFire={onFire}
          onKilled={onKilled}
          downgradedPerformance={downgradedPerformance}
        />
      ))}

      {(isHost() ? bullets : networkBullets).map((bullet) => (
        <Bullet
          key={bullet.id}
          player={bullet.player}
          angle={bullet.angle}
          position={bullet.position}
          onHit={(position) => onHit(bullet.id, position)}
        />
      ))}
      {(isHost() ? hits : networkHits).map((hit) => (
        <BulletHit
          key={hit.id}
          position={hit.position}
          onEnded={() => onHitEnded(hit.id)}
        />
      ))}

      <Environment preset="sunset" />
    </>
  );
};
