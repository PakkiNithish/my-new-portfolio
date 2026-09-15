(function () {
  "use strict";

  /* ============================================================
     CORE UTILITIES
     ============================================================ */
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var isReducedMotion = prefersReducedMotion.matches;
  var root = document.documentElement;
  var isMobile = window.innerWidth <= 820;

  // Listen for reduced-motion changes at runtime
  prefersReducedMotion.addEventListener("change", function (e) {
    isReducedMotion = e.matches;
  });

  // RAF-throttled scroll handler
  var scrollCallbacks = [];
  var scrollTicking = false;
  function onScroll() {
    if (!scrollTicking) {
      requestAnimationFrame(function () {
        var scrollY = window.scrollY || window.pageYOffset;
        var docHeight = document.documentElement.scrollHeight - window.innerHeight;
        for (var i = 0; i < scrollCallbacks.length; i++) {
          scrollCallbacks[i](scrollY, docHeight);
        }
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ============================================================
     THEME TOGGLE — With rotation micro-animation
     ============================================================ */
  (function themeInit() {
    var stored = null;
    try { stored = window.__portfolioTheme || null; } catch (e) {}
    var systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var theme = stored || (systemDark ? "dark" : "dark");
    root.setAttribute("data-theme", theme);

    var btn = document.getElementById("themeToggle");
    btn.addEventListener("click", function () {
      var current = root.getAttribute("data-theme");
      var next = current === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { window.__portfolioTheme = next; } catch (e) {}

      // Spin micro-animation
      if (!isReducedMotion) {
        btn.classList.add("spin");
        setTimeout(function () { btn.classList.remove("spin"); }, 500);
      }
    });
  })();

  /* ============================================================
     MOBILE NAV — Hamburger ↔ X morph + staggered links
     ============================================================ */
  (function navInit() {
    var toggle = document.getElementById("navToggle");
    var links = document.getElementById("navLinks");

    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
        toggle.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  })();

  /* ============================================================
     SCROLL PROGRESS BAR
     ============================================================ */
  (function scrollProgress() {
    var bar = document.getElementById("scrollProgress");
    if (!bar) return;

    scrollCallbacks.push(function (scrollY, docHeight) {
      var pct = docHeight > 0 ? scrollY / docHeight : 0;
      bar.style.setProperty("--scroll-pct", Math.min(pct, 1).toFixed(4));
    });
  })();

  /* ============================================================
     NAV ACTIVE INDICATOR — Sliding pill
     ============================================================ */
  (function activeNav() {
    var navAnchors = Array.prototype.slice.call(document.querySelectorAll("[data-nav]"));
    var sections = navAnchors.map(function (a) {
      return document.querySelector(a.getAttribute("href"));
    }).filter(Boolean);
    var indicator = document.getElementById("navIndicator");

    if (!sections.length || !("IntersectionObserver" in window)) return;

    var map = {};
    navAnchors.forEach(function (a) { map[a.getAttribute("href")] = a; });

    var currentActive = null;

    function positionIndicator(anchor) {
      if (!anchor || !indicator || isMobile) return;
      var rect = anchor.getBoundingClientRect();
      var navRect = anchor.closest("ul").getBoundingClientRect();
      indicator.style.left = (rect.left - navRect.left) + "px";
      indicator.style.width = rect.width + "px";
    }

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var href = "#" + entry.target.id;
        if (entry.isIntersecting) {
          navAnchors.forEach(function (a) { a.classList.remove("active"); });
          if (map[href]) {
            map[href].classList.add("active");
            currentActive = map[href];
            positionIndicator(map[href]);
          }
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });

    sections.forEach(function (s) { obs.observe(s); });

    // Reposition on resize
    window.addEventListener("resize", function () {
      isMobile = window.innerWidth <= 820;
      if (currentActive) positionIndicator(currentActive);
    });
  })();

  /* ============================================================
     SCROLL REVEAL SYSTEM — Per-section stagger
     ============================================================ */
  (function revealInit() {
    var items = document.querySelectorAll(".reveal, .t-item");
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (i) { i.classList.add("in"); });
      return;
    }

    // Assign stagger classes to reveals within the same parent section
    var sections = document.querySelectorAll("[data-section]");
    sections.forEach(function (section) {
      var reveals = section.querySelectorAll(".reveal");
      reveals.forEach(function (el, idx) {
        if (idx > 0 && idx <= 5) {
          el.classList.add("stagger-" + idx);
        }
      });
    });

    var obs = new IntersectionObserver(function (entries, ob) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          ob.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });

    items.forEach(function (i) { obs.observe(i); });
  })();

  /* ============================================================
     HERO ENTRANCE SEQUENCE — Composed, refined timing
     ============================================================ */
  (function heroSequence() {
    var eyebrow = document.getElementById("heroEyebrow");
    var h1 = document.getElementById("heroH1");
    var words = h1 ? h1.querySelectorAll(".hero-word") : [];
    var lede = document.getElementById("heroLede");
    var ctas = document.getElementById("heroCtas");
    var meta = document.getElementById("heroMeta");
    var visual = document.getElementById("heroVisual");

    if (isReducedMotion) {
      // Instant reveal
      if (eyebrow) eyebrow.classList.add("in");
      if (h1) h1.classList.add("in");
      words.forEach(function (w) { w.classList.add("in"); });
      if (lede) lede.classList.add("in");
      if (ctas) ctas.classList.add("in");
      if (meta) meta.classList.add("in");
      if (visual) visual.classList.add("in");
      return;
    }

    // Composed sequence with rAF-based timing
    var sequence = [
      { delay: 80,  fn: function () { if (eyebrow) eyebrow.classList.add("in"); } },
      { delay: 200, fn: function () { if (h1) h1.classList.add("in"); } },
    ];

    // Word-by-word stagger for the name
    words.forEach(function (word, idx) {
      sequence.push({
        delay: 280 + (idx * 70),
        fn: function () { word.classList.add("in"); }
      });
    });

    var lastWordDelay = 280 + (words.length * 70);
    sequence.push({ delay: lastWordDelay + 120, fn: function () { if (lede) lede.classList.add("in"); } });
    sequence.push({ delay: lastWordDelay + 280, fn: function () { if (ctas) ctas.classList.add("in"); } });
    sequence.push({ delay: lastWordDelay + 200, fn: function () { if (visual) visual.classList.add("in"); } });
    sequence.push({ delay: lastWordDelay + 440, fn: function () { if (meta) meta.classList.add("in"); } });

    sequence.forEach(function (step) {
      setTimeout(step.fn, step.delay);
    });
  })();

  /* ============================================================
     TIMELINE — Progressive draw-in + active milestone
     ============================================================ */
  (function timelineInit() {
    var timelines = document.querySelectorAll(".timeline");
    if (!timelines.length || !("IntersectionObserver" in window)) return;

    timelines.forEach(function (timeline) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            timeline.classList.add("drawn");
            obs.unobserve(timeline);
          }
        });
      }, { threshold: 0.1 });
      obs.observe(timeline);
    });

    // Active milestone tracking
    var tItems = document.querySelectorAll(".t-item");
    if (tItems.length > 0) {
      var milestoneObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          entry.target.classList.toggle("active", entry.isIntersecting);
        });
      }, { rootMargin: "-30% 0px -60% 0px", threshold: 0 });

      tItems.forEach(function (item) { milestoneObs.observe(item); });
    }
  })();

  /* ============================================================
     SKILL BARS — Initialize CSS custom properties
     ============================================================ */
  (function skillsInit() {
    var fills = document.querySelectorAll(".skill-item__fill");
    fills.forEach(function (f) {
      var w = f.getAttribute("data-width");
      if (w) f.style.setProperty("--bar-w", (parseFloat(w) / 100).toString());
    });
  })();

  /* ============================================================
     PRODUCTS SEQUENCE — Connecting line fill + active milestone
     ============================================================ */
  (function productsSequence() {
    var lineFill = document.getElementById("productsLineFill");
    var items = document.querySelectorAll(".product-item");
    var sequence = document.querySelector(".products-sequence");
    if (!sequence || !items.length) return;

    if (!isReducedMotion && lineFill) {
      scrollCallbacks.push(function () {
        var seqRect = sequence.getBoundingClientRect();
        var winH = window.innerHeight;
        var start = winH * 0.7;
        var progress = (start - seqRect.top) / (seqRect.height - (winH * 0.2));
        var pct = Math.max(0, Math.min(1, progress));
        lineFill.style.height = (pct * 100) + "%";
      });
    }

    if ("IntersectionObserver" in window) {
      var itemObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          entry.target.classList.toggle("active", entry.isIntersecting);
        });
      }, { rootMargin: "-25% 0px -40% 0px", threshold: 0 });

      items.forEach(function (it) { itemObs.observe(it); });
    }
  })();

  /* ============================================================
     FOOTER YEAR
     ============================================================ */
  document.getElementById("year").textContent = new Date().getFullYear();

  /* ============================================================
     CONTACT FORM (mailto, client-side only)
     ============================================================ */
  (function contactForm() {
    var form = document.getElementById("contactForm");
    var status = document.getElementById("formStatus");

    function setError(id, msg) {
      var el = document.getElementById(id);
      if (el) el.textContent = msg || "";
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // honeypot
      var hp = form.querySelector("#companySite");
      if (hp && hp.value) return;

      var name = form.name.value.trim();
      var email = form.email.value.trim();
      var message = form.message.value.trim();
      var valid = true;

      setError("err-name", ""); setError("err-email", ""); setError("err-message", "");

      if (!name) { setError("err-name", "Please enter your name."); valid = false; }
      if (!email) {
        setError("err-email", "Please enter your email."); valid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError("err-email", "Please enter a valid email address."); valid = false;
      }
      if (!message) { setError("err-message", "Please add a short message."); valid = false; }

      status.classList.remove("show", "ok");
      status.textContent = "";

      if (!valid) {
        status.textContent = "Please fix the highlighted fields.";
        status.classList.add("show");
        return;
      }

      var subject = encodeURIComponent("Portfolio contact from " + name);
      var body = encodeURIComponent(message + "\n\n" + name + " (" + email + ")");
      window.location.href = "mailto:nithishpakki18@gmail.com?subject=" + subject + "&body=" + body;

      status.textContent = "Opening your email app with this message prefilled";
      status.classList.add("show", "ok");
      form.reset();
    });
  })();

  /* ============================================================
     3D HERO: NODE GRAPH — Improved
     ============================================================ */
  (function heroVisual() {
    var container = document.getElementById("heroVisual");
    var fallback = document.getElementById("heroFallback");
    var supportsWebGL = (function () {
      try {
        var c = document.createElement("canvas");
        return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
      } catch (e) { return false; }
    })();

    if (isReducedMotion || !supportsWebGL || typeof THREE === "undefined") {
      // static SVG fallback stays visible, canvas never mounts
      return;
    }

    function init() {
      fallback.style.display = "none";

      var width = container.clientWidth, height = container.clientHeight;
      var scene = new THREE.Scene();

      // Camera: start further out for intro dolly
      var camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      var cameraStartZ = 9.5;
      var cameraEndZ = 7.5;
      camera.position.set(0, 0, cameraStartZ);

      var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      container.appendChild(renderer.domElement);

      var group = new THREE.Group();
      scene.add(group);

      // Generate node positions
      var NODE_COUNT = 26;
      var nodes = [];
      for (var i = 0; i < NODE_COUNT; i++) {
        var phi = Math.acos(-1 + (2 * i) / NODE_COUNT);
        var theta = Math.sqrt(NODE_COUNT * Math.PI) * phi;
        var r = 3.1;
        nodes.push(new THREE.Vector3(
          r * Math.cos(theta) * Math.sin(phi),
          r * Math.sin(theta) * Math.sin(phi),
          r * Math.cos(phi)
        ));
      }

      // Points with depth-based opacity variation
      var pointsGeo = new THREE.BufferGeometry().setFromPoints(nodes);
      var pointsMat = new THREE.PointsMaterial({
        color: 0x3dd6f5, size: 0.09, transparent: true, opacity: 0.95,
        sizeAttenuation: true
      });
      var pointCloud = new THREE.Points(pointsGeo, pointsMat);
      group.add(pointCloud);

      // Connections between nearby nodes
      var lineVerts = [];
      var THRESH = 2.1;
      for (var a = 0; a < nodes.length; a++) {
        for (var b = a + 1; b < nodes.length; b++) {
          if (nodes[a].distanceTo(nodes[b]) < THRESH) {
            lineVerts.push(nodes[a].x, nodes[a].y, nodes[a].z, nodes[b].x, nodes[b].y, nodes[b].z);
          }
        }
      }
      var lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(lineVerts, 3));
      var lineMat = new THREE.LineBasicMaterial({ color: 0x5b8def, transparent: true, opacity: 0.28 });
      var lines = new THREE.LineSegments(lineGeo, lineMat);
      group.add(lines);

      var ambient = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambient);

      var targetRotX = 0, targetRotY = 0;
      var currentRotX = 0, currentRotY = 0;

      // Scoped pointer listener — only tracks when pointer is over the hero
      function onPointerMove(e) {
        var rect = container.getBoundingClientRect();
        var cx = (e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0].clientX)) - rect.left;
        var cy = (e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0].clientY)) - rect.top;
        targetRotY = ((cx / rect.width) - 0.5) * 0.5;
        targetRotX = ((cy / rect.height) - 0.5) * -0.5;
      }
      // Scope to container instead of window
      container.addEventListener("mousemove", onPointerMove, { passive: true });
      container.addEventListener("mouseleave", function () {
        targetRotX = 0;
        targetRotY = 0;
      });

      var clock = new THREE.Clock();
      var frameId;
      var introComplete = false;

      function animate() {
        frameId = requestAnimationFrame(animate);
        var t = clock.getElapsedTime();

        // Intro camera dolly (first 1.5s)
        if (!introComplete) {
          var dollyProgress = Math.min(t / 1.5, 1);
          // Ease-out curve
          var easedProgress = 1 - Math.pow(1 - dollyProgress, 3);
          camera.position.z = cameraStartZ + (cameraEndZ - cameraStartZ) * easedProgress;
          if (dollyProgress >= 1) introComplete = true;
        }

        // Smoother lerp factor, reduced constant rotation speed (~40% slower)
        currentRotX += (targetRotX - currentRotX) * 0.035;
        currentRotY += (targetRotY - currentRotY) * 0.035;
        group.rotation.x = currentRotX + Math.sin(t * 0.12) * 0.04;
        group.rotation.y = currentRotY + t * 0.035;
        renderer.render(scene, camera);
      }
      animate();

      // Debounced resize
      var resizeTimer;
      window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
          var w = container.clientWidth, h = container.clientHeight;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }, 150);
      });

      // Pause rendering when off-screen (both IO and Page Visibility)
      if ("IntersectionObserver" in window) {
        var visObs = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              if (!frameId) animate();
            } else {
              if (frameId) {
                cancelAnimationFrame(frameId);
                frameId = null;
              }
            }
          });
        }, { threshold: 0.05 });
        visObs.observe(container);
      }

      // Also pause on page visibility change
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) {
          if (frameId) {
            cancelAnimationFrame(frameId);
            frameId = null;
          }
        } else {
          if (!frameId) animate();
        }
      });
    }

    if (typeof THREE !== "undefined") {
      init();
    } else {
      window.addEventListener("load", function () {
        if (typeof THREE !== "undefined") init();
      });
    }
  })();

})();
