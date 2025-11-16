import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Loader, SoftShadows, PerformanceMonitor } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { Bloom, EffectComposer } from "@react-three/postprocessing";

import { Experience } from "./components/Experience";
import Leaderboard from "./components/Leaderboard";

function App() {
  const [downgradedPerformance, setDowngradedPerformance] = useState(false);

  return (
    <>
      <Loader />
      <Leaderboard />

      <Canvas
        shadows
        camera={{ position: [0, 30, 3], fov: 30, near: 2 }}
        dpr={[1, 1.5]} // optimization to increase performance on retina/4k devices
      >
        <color attach="background" args={["#242424"]} />
        <SoftShadows size={42} />

        <PerformanceMonitor
          // Detect low performance devices
          onDecline={(_) => {
            setDowngradedPerformance(true);
          }}
        />
        <Suspense>
          <Physics debug={false}>
            <Experience downgradedPerformance={downgradedPerformance} />
          </Physics>
        </Suspense>

        <EffectComposer enableNormalPass={false}>
          <Bloom luminanceThreshold={1} intensity={1.5} mipmapBlur />
        </EffectComposer>
      </Canvas>
    </>
  );
}

export default App;
