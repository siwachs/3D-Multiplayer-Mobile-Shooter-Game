import { useRef, useState } from "react";
import { Joystick } from "playroomkit";

import { Soldier } from "./characters";

import type { Group } from "three";

interface ControllerProps {
  state: any;
  joystick: Joystick;
  userPlayer: boolean;
  [key: string]: any;
}

const CharacterController: React.FC<ControllerProps> = ({
  state,
  joystick,
  userPlayer,
  ...props
}) => {
  const [animation, setAnimation] = useState("Ideal");
  const group = useRef<Group>(null!);
  const character = useRef(null!);

  return (
    <group ref={group} {...props}>
      <group ref={character}>
        <Soldier color={state.state.profile?.color} animation={animation} />
      </group>
    </group>
  );
};

export default CharacterController;
