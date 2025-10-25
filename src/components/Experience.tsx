import { useEffect, useState } from "react";
import { OrbitControls, Environment } from "@react-three/drei";
import { insertCoin, Joystick, myPlayer, onPlayerJoin } from "playroomkit";

import BattleGround from "./BattleGround";
import CharacterController from "./CharacterController";

import type { Player } from "../types";

export const Experience = () => {
  const [players, setPlayers] = useState<Player[]>([]);

  const start = async () => {
    await insertCoin();
  };

  useEffect(() => {
    start();

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
  }, []);

  return (
    <>
      <directionalLight
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
      />
      <OrbitControls />
      <BattleGround />
      {players.map(({ state, joystick }, idx) => (
        <CharacterController
          key={state.id}
          position-x={idx * 2}
          state={state}
          joystick={joystick}
          userPlayer={state.id === myPlayer()?.id}
        />
      ))}
      <Environment preset="sunset" />
    </>
  );
};
