import { Joystick } from "playroomkit";

export interface Player {
  state: any;
  joystick: Joystick;
}

export type Animation = "Idle" | "Run";
