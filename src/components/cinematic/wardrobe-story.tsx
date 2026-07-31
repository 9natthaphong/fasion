"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  getActiveCinematicChapter,
  progressToVideoTime,
  WARDROBE_STORY_CHAPTERS,
  WARDROBE_STORY_DURATION_SECONDS,
} from "@/lib/cinematic";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const storyCopy = [
  {
    id: "opening",
    index: "01 / 05",
    eyebrow: "YOURSTYLIST / AI STYLIST",
    title: "วันนี้จะไปไหน?",
    body: "เริ่มจากสิ่งที่คุณมีอยู่แล้ว ให้กลายเป็นลุคที่เหมาะกับวันนี้",
  },
  {
    id: "wardrobe",
    index: "02 / 05",
    eyebrow: "YOUR PRIVATE WARDROBE",
    title: "เปิดตู้เสื้อผ้าของคุณ",
    body: "ถ่ายรูปเสื้อ กางเกง รองเท้า และชิ้นโปรด เก็บไว้ในพื้นที่ส่วนตัวของคุณ",
  },
  {
    id: "intelligence",
    index: "03 / 05",
    eyebrow: "NEUTRAL BY DESIGN",
    title: "AI มองจากชุดที่คุณมีจริง",
    body: "กิจกรรม อากาศ เวลา และสไตล์ของคุณ โดยไม่มีโฆษณามาเปลี่ยนคำแนะนำ",
  },
  {
    id: "directions",
    index: "04 / 05",
    eyebrow: "THREE DIRECTIONS",
    title: "หนึ่งวัน สามทิศทาง",
    body: "ใส่ง่าย / แต่งขึ้น / สบาย พร้อมเหตุผลและชิ้นที่ต้องใช้",
  },
  {
    id: "ready",
    index: "05 / 05",
    eyebrow: "READY FOR TODAY",
    title: "พร้อมสำหรับวันนี้",
    body: "เลือกทิศทางที่ตรงกับชีวิตจริง แล้วออกไปใช้วันของคุณ",
  },
] as const;

export function WardrobeStory() {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let warmupTimer = 0;
    const warmVideoBuffer = () => {
      warmupTimer = window.setTimeout(() => {
        video.preload = "auto";
        video.load();
      }, 0);
    };

    if (document.readyState === "complete") {
      warmVideoBuffer();
    } else {
      window.addEventListener("load", warmVideoBuffer, { once: true });
    }

    return () => {
      window.removeEventListener("load", warmVideoBuffer);
      if (warmupTimer) window.clearTimeout(warmupTimer);
    };
  }, []);

  useGSAP(
    () => {
      const root = rootRef.current;
      const stage = stageRef.current;
      const video = videoRef.current;
      if (!root || !stage || !video) return;

      const chapterElements = gsap.utils.toArray<HTMLElement>(
        "[data-cinematic-chapter]",
        root,
      );
      let targetTime = 0;
      let animationFrame = 0;
      let stageVisible = true;
      let lastSeekAt = 0;

      const settleVideo = (timestamp: number) => {
        animationFrame = 0;
        if (document.hidden || !stageVisible || video.readyState < 1) return;
        if (video.seeking || timestamp - lastSeekAt < 42) {
          animationFrame = window.requestAnimationFrame(settleVideo);
          return;
        }
        const difference = targetTime - video.currentTime;
        if (Math.abs(difference) < 0.006) {
          return;
        }
        video.currentTime += difference * 0.34;
        lastSeekAt = timestamp;
        animationFrame = window.requestAnimationFrame(settleVideo);
      };

      const requestVideoFrame = () => {
        if (!animationFrame) {
          animationFrame = window.requestAnimationFrame(settleVideo);
        }
      };

      const copyTimeline = gsap.timeline({ paused: true });
      const timelineEndMarker = { progress: 0 };
      gsap.set(chapterElements, { autoAlpha: 0, y: 24 });
      gsap.set(chapterElements[0], { autoAlpha: 1, y: 0 });

      WARDROBE_STORY_CHAPTERS.forEach((chapter, index) => {
        const element = chapterElements[index];
        if (!element) return;
        if (index > 0) {
          copyTimeline.fromTo(
            element,
            { autoAlpha: 0, y: 24 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.035,
              ease: "power2.out",
              immediateRender: false,
            },
            chapter.start,
          );
        }
        if (index < WARDROBE_STORY_CHAPTERS.length - 1) {
          copyTimeline.to(
            element,
            {
              autoAlpha: 0,
              y: -18,
              duration: 0.035,
              ease: "power2.in",
            },
            Math.max(chapter.start + 0.08, chapter.end - 0.035),
          );
        }
      });
      copyTimeline.to(
        timelineEndMarker,
        { progress: 1, duration: 0.001, ease: "none" },
        0.999,
      );

      const updateProgress = (progress: number) => {
        const duration = Number.isFinite(video.duration)
          ? video.duration
          : WARDROBE_STORY_DURATION_SECONDS;
        targetTime = progressToVideoTime(progress, duration);
        copyTimeline.progress(progress);
        root.style.setProperty("--cinematic-progress", `${progress * 100}%`);
        root.dataset.activeChapter = getActiveCinematicChapter(progress).id;
        requestVideoFrame();
      };

      const onMetadata = () => {
        video.pause();
        root.dataset.videoReady = "true";
        updateProgress(Number(root.dataset.progress ?? 0));
        ScrollTrigger.refresh();
      };
      const onVisibilityChange = () => {
        if (document.hidden && animationFrame) {
          window.cancelAnimationFrame(animationFrame);
          animationFrame = 0;
          video.pause();
        } else {
          requestVideoFrame();
        }
      };
      const observer = new IntersectionObserver(
        ([entry]) => {
          stageVisible = entry.isIntersecting;
          if (!stageVisible && animationFrame) {
            window.cancelAnimationFrame(animationFrame);
            animationFrame = 0;
          }
        },
        { rootMargin: "20% 0px" },
      );

      video.addEventListener("loadedmetadata", onMetadata);
      document.addEventListener("visibilitychange", onVisibilityChange);
      observer.observe(stage);
      if (video.readyState >= 1) onMetadata();

      const media = gsap.matchMedia();
      media.add(
        {
          desktop: "(min-width: 48rem)",
          mobile: "(max-width: 47.99rem)",
          reduce: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const { desktop, reduce } = context.conditions as {
            desktop: boolean;
            mobile: boolean;
            reduce: boolean;
          };

          if (reduce) {
            root.dataset.motion = "reduced";
            gsap.set(chapterElements, { clearProps: "all" });
            targetTime = 0.65;
            requestVideoFrame();
            return;
          }

          root.dataset.motion = "scrub";
          const trigger = ScrollTrigger.create({
            trigger: root,
            start: "top 64px",
            end: desktop
              ? () => `+=${Math.round(window.innerHeight * 5.2)}`
              : "bottom bottom",
            pin: desktop ? stage : false,
            pinSpacing: desktop,
            scrub: 0.55,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              root.dataset.progress = String(self.progress);
              updateProgress(self.progress);
            },
          });

          updateProgress(trigger.progress);
          return () => trigger.kill();
        },
      );

      return () => {
        media.revert();
        observer.disconnect();
        document.removeEventListener("visibilitychange", onVisibilityChange);
        video.removeEventListener("loadedmetadata", onMetadata);
        video.pause();
        if (animationFrame) window.cancelAnimationFrame(animationFrame);
        copyTimeline.kill();
      };
    },
    { scope: rootRef },
  );

  return (
    <section
      ref={rootRef}
      className="cinematic-story"
      aria-labelledby="cinematic-story-title"
      data-testid="cinematic-story"
      data-video-ready="false"
      data-active-chapter="opening"
    >
      <div ref={stageRef} className="cinematic-stage">
        <video
          ref={videoRef}
          className="cinematic-video"
          muted
          playsInline
          preload="none"
          poster="/videos-assets/fittoday-wardrobe-story-poster.webp"
          aria-hidden="true"
          tabIndex={-1}
          data-testid="cinematic-video"
        >
          <source
            src="/videos-assets/fittoday-wardrobe-story.mp4"
            type="video/mp4"
          />
        </video>
        <div className="cinematic-loading" aria-hidden="true">
          <span />
          กำลังเตรียมภาพยนตร์
        </div>
        <div className="cinematic-local-scrim" aria-hidden="true" />

        <div className="cinematic-copy-stack">
          {storyCopy.map((chapter, index) => (
            <article
              key={chapter.id}
              className={`cinematic-chapter cinematic-chapter-${WARDROBE_STORY_CHAPTERS[index].placement}`}
              data-cinematic-chapter={chapter.id}
              data-testid={`cinematic-chapter-${chapter.id}`}
            >
              <div className="cinematic-chapter-meta">
                <span>{chapter.eyebrow}</span>
                <span>{chapter.index}</span>
              </div>
              {index === 0 ? (
                <h1 id="cinematic-story-title">{chapter.title}</h1>
              ) : (
                <h2>{chapter.title}</h2>
              )}
              <p>{chapter.body}</p>
              {chapter.id === "ready" ? (
                <div className="cinematic-actions">
                  <Link href="/ai-stylist" className="cinematic-primary-action">
                    ให้ AI เลือกชุดวันนี้
                    <ArrowRight aria-hidden="true" />
                  </Link>
                  <Link href="/account/wardrobe" className="cinematic-secondary-action">
                    เปิดตู้เสื้อผ้าของฉัน
                  </Link>
                </div>
              ) : null}
            </article>
          ))}
        </div>

        <div className="cinematic-privacy-note">
          <LockKeyhole aria-hidden="true" />
          <span>ตู้เสื้อผ้าส่วนตัว · โฆษณาไม่กระทบคำแนะนำ</span>
        </div>
        <div className="cinematic-progress" aria-hidden="true">
          <span />
        </div>
      </div>
    </section>
  );
}
