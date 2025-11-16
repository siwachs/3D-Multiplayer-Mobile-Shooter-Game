import { Joystick } from "playroomkit";

export interface BodyUserData {
  type: string;
  damage: number;
  [key: string]: any;
}

export interface Player {
  state: any;
  joystick: Joystick;
}

export type Position = { x: number; y: number; z: number };

export type Animation = "Idle" | "Run";
