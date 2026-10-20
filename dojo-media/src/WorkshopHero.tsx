import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useReducedMotion } from "./motion";

const DURATION = 36;
const SOURCE = `${import.meta.env.BASE_URL}assets/workshop.png`;
const DESCRIPTION =
  "Мастерская Додзё Медиа: мастера за общим столом с ноутбуками и проектами";

/** Original Figma image, cropped to the current Figma layout and settled in 0.9 seconds. */
export function WorkshopComposition() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={SOURCE}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          translate: `0 ${interpolate(frame, [0, 0.9 * fps], [8, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) })}px`,
        }}
      />
    </AbsoluteFill>
  );
}

export function WorkshopHero() {
  const reduced = useReducedMotion();
  const container = useRef<HTMLDivElement>(null);
  const player = useRef<PlayerRef>(null);
  const completed = useRef(false);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 482 });
  const [status, setStatus] = useState("static");
  useLayoutEffect(() => {
    const element = container.current;
    if (!element) return;
    const resize = () =>
      setDimensions({
        width: Math.max(1, Math.round(element.clientWidth)),
        height: Math.max(1, Math.round(element.clientHeight)),
      });
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (reduced) {
      setStatus("static");
      return;
    }
    const element = container.current;
    const instance = player.current;
    if (!element || !instance) return;
    let inViewport = false;
    const update = () => {
      if (completed.current) return;
      if (inViewport && !document.hidden) {
        instance.play();
        setStatus("playing");
      } else {
        instance.pause();
        setStatus("paused");
      }
    };
    const observer = new IntersectionObserver(
      (entries) => {
        inViewport = entries[0].isIntersecting;
        update();
      },
      { threshold: 0.05 },
    );
    const finish = () => {
      completed.current = true;
      setStatus("complete");
    };
    instance.addEventListener("ended", finish);
    observer.observe(element);
    document.addEventListener("visibilitychange", update);
    return () => {
      instance.pause();
      observer.disconnect();
      instance.removeEventListener("ended", finish);
      document.removeEventListener("visibilitychange", update);
    };
  }, [reduced]);
  return (
    <div
      className="hero-media"
      ref={container}
      role="img"
      aria-label={DESCRIPTION}
      data-animation={status}
    >
      {reduced ? (
        <img
          src={SOURCE}
          alt=""
          width="2252"
          height="904"
          fetchPriority="high"
        />
      ) : (
        <div className="hero-player" aria-hidden="true">
          <Player
            ref={player}
            component={WorkshopComposition}
            durationInFrames={DURATION}
            compositionWidth={dimensions.width}
            compositionHeight={dimensions.height}
            fps={30}
            controls={false}
            autoPlay={false}
            loop={false}
            moveToBeginningWhenEnded={false}
            clickToPlay={false}
            doubleClickToFullscreen={false}
            spaceKeyToPlayOrPause={false}
            numberOfSharedAudioTags={0}
            style={{ width: "100%", height: "100%" }}
            renderLoading={() => (
              <img
                src={SOURCE}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            )}
            errorFallback={() => (
              <img
                src={SOURCE}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            )}
          />
        </div>
      )}
    </div>
  );
}
