import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { SoftShadows } from "@react-three/drei";
import { Physics } from "@react-three/rapier";

import { Experience } from "./components/Experience";

function App() {
  return (
    <Canvas shadows camera={{ position: [0, 30, 3], fov: 30 }}>
      <color attach="background" args={["#242424"]} />
      <SoftShadows size={42} />
      <Suspense>
        <Physics debug>
          <Experience />
        </Physics>
      </Suspense>
    </Canvas>
  );
}

export default App;
