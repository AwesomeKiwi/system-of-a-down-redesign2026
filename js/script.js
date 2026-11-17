/* SYSTEM OF A DOWN — sito non ufficiale · script (rework 2026) */

document.addEventListener("DOMContentLoaded", function () {

  /* ---------- Pannello "Album" nell'header ----------
     Al posto di style.display, il pannello usa l'attributo hidden
     e il pulsante comunica lo stato con aria-expanded (accessibile
     anche da tastiera e screen reader). Si chiude con Esc o cliccando fuori. */
  var toggle = document.querySelector("[data-album-toggle]");
  var panel = document.getElementById("album-panel");

  if (toggle && panel) {
    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      panel.hidden = !open;
    };

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) { setOpen(false); toggle.focus(); }
    });

    document.addEventListener("click", function (e) {
      if (!panel.hidden && !panel.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
    });
  }


  /* ---------- Forum: commento simulato ----------
     Come nel 2021: il commento compare come "anonimo", poi il campo si blocca
     e chiede di accedere. Corretti due bug: il mese partiva da 0
     (getMonth) e i minuti non avevano lo zero iniziale (es. 19.7). */
  var composer = document.getElementById("composer");

  if (composer) {
    var textarea = composer.querySelector("textarea");
    var submit = composer.querySelector("button");
    var threads = document.getElementById("threads");

    composer.addEventListener("submit", function (e) {
      e.preventDefault();
      var text = textarea.value.trim();
      if (!text) { textarea.focus(); return; }

      var now = new Date();
      var pad = function (n) { return String(n).padStart(2, "0"); };
      var date = "il " + now.getDate() + "/" + (now.getMonth() + 1) + "/" + now.getFullYear() +
                 ", " + now.getHours() + "." + pad(now.getMinutes());

      var thread = document.createElement("article");
      thread.className = "thread";
      thread.innerHTML =
        '<div class="post post--new">' +
          '<img class="avatar" src="immagini/useran.jpg" alt="">' +
          '<div class="post__body">' +
            '<p class="post__meta"><span class="post__author">anonimo</span><span class="post__date"></span></p>' +
            '<p class="post__text"></p>' +
          '</div>' +
        '</div>';
      thread.querySelector(".post__date").textContent = date;
      thread.querySelector(".post__text").textContent = text;   // textContent: nessun HTML iniettato
      threads.prepend(thread);

      textarea.value = "";
      textarea.disabled = true;
      textarea.placeholder = "Accedi per commentare.";
      submit.disabled = true;
      submit.textContent = "Accedi per commentare";
    });
  }


  /* ---------- Galleria "Dai videoclip" ----------
     Scorre da sola lentamente verso sinistra, all'infinito: le foto vengono
     duplicate e, quando la prima serie è uscita del tutto, si torna indietro
     di esattamente una serie (il salto è invisibile).
     Si può anche: trascinarla col mouse, scorrerla con la rotella o con il
     trackpad (più veloce), muoverla con le frecce da tastiera.
     Dopo un'interazione l'animazione riparte da sola. */
  document.querySelectorAll("[data-gallery]").forEach(function (track) {
    var list = track.querySelector(".gallery__list");
    var originals = Array.prototype.slice.call(list.children);

    originals.forEach(function (li) {            // seconda serie per il loop
      var clone = li.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.querySelector("img").alt = "";
      list.appendChild(clone);
    });
    var firstClone = list.children[originals.length];

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var SPEED = 28;          // pixel al secondo dello scorrimento automatico
    var WHEEL_BOOST = 1.6;   // quanto corre la rotella rispetto al normale
    var pos = 0;             // posizione "vera" (con decimali)
    var pausedUntil = 0;
    var last = performance.now();

    var loopWidth = function () { return firstClone.offsetLeft - list.children[0].offsetLeft; };

    var wrap = function () {
      var w = loopWidth();
      if (w <= 0) return;
      if (pos >= w) pos -= w;
      if (pos < 0) pos += w;
      track.scrollLeft = pos;
    };

    var pause = function (ms) { pausedUntil = performance.now() + ms; };

    var tick = function (now) {
      var dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      // se l'utente ha scorso da solo (trackpad, barra), riparto da lì
      if (Math.abs(track.scrollLeft - pos) > 2) { pos = track.scrollLeft; pause(1500); }
      if (!reduceMotion && now > pausedUntil && !dragging) pos += SPEED * dt;
      wrap();
      requestAnimationFrame(tick);
    };

    // rotella del mouse: anche lo scroll verticale muove la galleria in orizzontale
    track.addEventListener("wheel", function (e) {
      var delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (!delta) return;
      e.preventDefault();
      pos += delta * WHEEL_BOOST;
      wrap();
      pause(1500);
    }, { passive: false });

    // trascinamento con mouse / dito
    var dragging = false, startX = 0, startPos = 0;
    track.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      dragging = true; startX = e.clientX; startPos = pos;
      track.classList.add("is-dragging");
      track.setPointerCapture(e.pointerId);
    });
    track.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      pos = startPos - (e.clientX - startX);
      wrap();
    });
    var endDrag = function () {
      if (!dragging) return;
      dragging = false;
      track.classList.remove("is-dragging");
      pause(1500);
    };
    track.addEventListener("pointerup", endDrag);
    track.addEventListener("pointercancel", endDrag);

    // tastiera: frecce sinistra/destra quando la galleria ha il focus
    track.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      pos += (e.key === "ArrowRight" ? 1 : -1) * track.clientWidth * 0.6;
      wrap();
      pause(3000);
    });

    requestAnimationFrame(tick);
  });


  /* ---------- Forum: finto "Carica altro" ---------- */
  var more = document.getElementById("load-more");

  if (more) {
    more.addEventListener("click", function () {
      more.disabled = true;
      more.textContent = "Caricamento…";
      setTimeout(function () {
        more.classList.add("is-error");
        more.textContent = "Errore di caricamento. Ricarica la pagina.";
      }, 1500);
    });
  }
});
