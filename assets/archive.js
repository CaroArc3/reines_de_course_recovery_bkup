(() => {
  const currentScript = document.currentScript;
  const archiveRoot = currentScript ? new URL("../", currentScript.src) : new URL("./", window.location.href);
  const pathName = window.location.pathname.toLowerCase();
  const isRootPage = pathName.endsWith("/index.html") || pathName.endsWith("/site/") || /\/site\/index\.html$/i.test(window.location.pathname);
  const versionEntries = {
    "2005": new URL("pages/index.htm", archiveRoot).href,
    "2011": new URL("versions/golden-base-2011/index.html", archiveRoot).href,
    "2017": new URL("pages/imsitemap.html", archiveRoot).href,
    "2020": new URL("pages/general/index.html", archiveRoot).href,
    "2021": new URL("pages/about/index.html", archiveRoot).href,
  };
  function updateTopbarHeight() {
    const bar = document.querySelector(".archive-topbar");
    if (!bar) return;
    document.documentElement.style.setProperty("--archive-topbar-height", `${bar.offsetHeight}px`);
  }

  function createLink(href, text, className) {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = text;
    if (className) link.className = className;
    return link;
  }

  function insertTopbar() {
    if (document.body.hasAttribute("data-archive-no-topbar") || document.querySelector(".archive-topbar")) {
      return;
    }
    const bar = document.createElement("div");
    bar.className = "archive-topbar";

    const title = document.createElement("div");
    title.className = "archive-topbar-title";
    title.textContent = "Reines-de-Course Archive";
    bar.appendChild(title);

    const nav = document.createElement("nav");
    nav.className = "archive-topbar-nav";
    nav.appendChild(createLink(new URL("index.html", archiveRoot).href, "Versions"));
    nav.appendChild(createLink(new URL("all-pages.html", archiveRoot).href, "Merged Index"));
    nav.appendChild(createLink(versionEntries["2005"], "2005"));
    nav.appendChild(createLink(versionEntries["2011"], "2011"));
    nav.appendChild(createLink(versionEntries["2017"], "2017"));
    nav.appendChild(createLink(versionEntries["2020"], "2020"));
    nav.appendChild(createLink(versionEntries["2021"], "2021"));
    bar.appendChild(nav);

    document.body.insertBefore(bar, document.body.firstChild);
    if (isRootPage && document.querySelector("main.archive-shell")) {
      document.body.classList.add("archive-home");
    }
    updateTopbarHeight();
    window.addEventListener("resize", updateTopbarHeight);
  }

  function addLayoutClasses() {
    const generatorMeta = Array.from(document.querySelectorAll("meta")).find((meta) => {
      const content = (meta.getAttribute("content") || "").toLowerCase();
      return content.includes("frontpage") || content.includes("website x5") || content.includes("wordpress");
    });
    const generator = generatorMeta ? (generatorMeta.getAttribute("content") || "").toLowerCase() : "";
    if (generator.includes("website x5") || document.querySelector("#imPage")) {
      document.body.classList.add("archive-layout-x5");
    } else if (generator.includes("wordpress") || document.querySelector(".site-content")) {
      document.body.classList.add("archive-layout-wp");
    } else if (generator.includes("frontpage")) {
      document.body.classList.add("archive-layout-frontpage");
    }
  }

  function repairFrontPageButtons() {
    document.querySelectorAll("a img[name^='MSFPnav'], a[onmouseover] img, a[onmouseout] img").forEach((img) => {
      const anchor = img.closest("a");
      if (!anchor) return;
      anchor.removeAttribute("language");
      anchor.removeAttribute("onmouseover");
      anchor.removeAttribute("onmouseout");
      anchor.classList.add("archive-fp-nav-link");
      anchor.querySelectorAll("img").forEach((node) => node.classList.add("archive-fp-nav-image"));
      if (!anchor.querySelector(".archive-fp-button")) {
        const label = document.createElement("span");
        label.className = "archive-fp-button";
        const fallback = anchor.getAttribute("title") || anchor.textContent.trim() || "Open";
        label.textContent = img.getAttribute("alt") || img.getAttribute("title") || fallback;
        anchor.appendChild(label);
      }
    });
  }

  function repairWordPressNavigation() {
    if (!document.body.classList.contains("archive-layout-wp")) return;

    const hubHref = versionEntries["2020"];
    const mergedIndexHref = new URL("all-pages.html", archiveRoot).href;
    const syncDesktopSidebar = () => {
      if (window.innerWidth > 960) {
        document.body.classList.add("archive-nav-open");
      }
    };
    syncDesktopSidebar();

    document.querySelectorAll(".site-title a, .menu-item-home > a, .imprint").forEach((anchor) => {
      anchor.href = hubHref;
    });

    document.querySelectorAll("form.search-form").forEach((form) => {
      form.setAttribute("action", mergedIndexHref);
      form.addEventListener("submit", (event) => {
        const field = form.querySelector("input[name='s'], input[type='search']");
        const query = field ? field.value.trim() : "";
        if (!query) return;
        event.preventDefault();
        const url = new URL(mergedIndexHref);
        url.searchParams.set("q", query);
        window.location.href = url.href;
      });
    });

    document.querySelectorAll(".secondary-toggle").forEach((button) => {
      const syncLabel = () => {
        const forcedOpenDesktop = window.innerWidth > 960;
        const isOpen = forcedOpenDesktop || document.body.classList.contains("archive-nav-open");
        button.textContent = isOpen ? "Hide menu and widgets" : "Show menu and widgets";
        button.setAttribute("aria-expanded", isOpen ? "true" : "false");
      };
      syncLabel();
      button.addEventListener("click", () => {
        if (window.innerWidth > 960) {
          document.body.classList.add("archive-nav-open");
          syncLabel();
          return;
        }
        document.body.classList.toggle("archive-nav-open");
        syncLabel();
      });
      window.addEventListener("resize", () => {
        syncDesktopSidebar();
        syncLabel();
      });
    });

    const navRoot = document.querySelector(".archive-layout-wp .main-navigation");
    if (navRoot) {
      enhanceTreeNavigation(navRoot, ".sub-menu");
    }
  }

  function repairX5Navigation() {
    if (!document.body.classList.contains("archive-layout-x5")) return;
    const hubHref = versionEntries["2017"];
    document.querySelectorAll("#imMnMn a[href='index.htm'], #imBtMn a[href='index.htm']").forEach((anchor) => {
      anchor.href = hubHref;
    });

    const navRoot = document.querySelector("#imMnMn");
    if (navRoot) {
      enhanceTreeNavigation(navRoot, "ul.auto");
    }
  }

  function normalizePath(value) {
    return value.replace(/\/+$/, "").toLowerCase() || "/";
  }

  function isCurrentLink(anchor) {
    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("javascript:")) return false;
    try {
      const url = new URL(href, window.location.href);
      return normalizePath(url.pathname) === normalizePath(window.location.pathname);
    } catch {
      return false;
    }
  }

  function openAncestorNodes(node) {
    let current = node ? node.parentElement : null;
    while (current) {
      if (current.matches("li.archive-has-children")) {
        current.classList.add("archive-open");
        const toggle = current.querySelector(":scope > .archive-tree-row > .archive-tree-toggle");
        if (toggle) toggle.setAttribute("aria-expanded", "true");
      }
      current = current.parentElement;
    }
  }

  function enhanceTreeNavigation(root, submenuSelector) {
    if (!root || root.dataset.archiveTreeReady === "true") return;
    root.dataset.archiveTreeReady = "true";
    root.classList.add("archive-tree-nav");

    root.querySelectorAll("a[href]").forEach((anchor) => {
      if (isCurrentLink(anchor) || anchor.closest(".current-menu-item, .current_page_item, .imMnMnCurrent")) {
        anchor.classList.add("archive-current-link");
        const item = anchor.closest("li");
        if (item) item.classList.add("archive-current-node");
      }
    });

    root.querySelectorAll("li").forEach((item) => {
      const submenu = Array.from(item.children).find((child) => child.matches && child.matches(submenuSelector));
      if (!submenu) return;

      item.classList.add("archive-has-children");
      const directLabel = Array.from(item.children).find((child) => child !== submenu && child.nodeType === 1);
      const row = document.createElement("div");
      row.className = "archive-tree-row";

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "archive-tree-toggle";
      toggle.setAttribute("aria-label", "Toggle section");
      row.appendChild(toggle);

      if (directLabel) {
        directLabel.classList.add("archive-tree-label");
        row.appendChild(directLabel);
      }

      item.insertBefore(row, submenu);

      const shouldOpen = item.classList.contains("archive-current-node") || !!item.querySelector(".archive-current-node, .archive-current-link");
      item.classList.toggle("archive-open", shouldOpen);
      toggle.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
      toggle.addEventListener("click", () => {
        const next = !item.classList.contains("archive-open");
        item.classList.toggle("archive-open", next);
        toggle.setAttribute("aria-expanded", next ? "true" : "false");
      });
    });

    root.querySelectorAll(".archive-current-node").forEach((item) => openAncestorNodes(item));
  }

  function decorateMissingLinks() {
    document.querySelectorAll("a[href*='missing.html?']").forEach((anchor) => {
      anchor.classList.add("archive-missing-link");
    });
  }

  function hydrateMissingPage() {
    if (!/missing\.html$/i.test(window.location.pathname)) return;
    const params = new URLSearchParams(window.location.search);
    const label = params.get("label") || "Unknown";
    const target = params.get("missing") || "Unknown";
    const source = params.get("source") || "Unknown";
    const wayback = params.get("wayback") || "";

    const labelNode = document.getElementById("missing-label");
    const targetNode = document.getElementById("missing-target");
    const sourceNode = document.getElementById("missing-source");
    const waybackNode = document.getElementById("missing-wayback");

    if (labelNode) labelNode.textContent = label;
    if (targetNode) targetNode.textContent = target;
    if (sourceNode) sourceNode.textContent = source;

    if (waybackNode) {
      if (wayback) {
        const anchor = document.createElement("a");
        anchor.href = wayback;
        anchor.textContent = wayback;
        anchor.rel = "noopener noreferrer";
        waybackNode.textContent = "";
        waybackNode.appendChild(anchor);
      } else {
        waybackNode.textContent = "Not provided";
      }
    }
  }

  function applyMergedIndexQuery() {
    const search = document.getElementById("search");
    if (!search) return;
    const query = new URLSearchParams(window.location.search).get("q");
    if (!query) return;
    search.value = query;
    search.dispatchEvent(new Event("input", { bubbles: true }));
  }

  document.addEventListener("DOMContentLoaded", () => {
    addLayoutClasses();
    insertTopbar();
    repairFrontPageButtons();
    repairWordPressNavigation();
    repairX5Navigation();
    decorateMissingLinks();
    hydrateMissingPage();
    applyMergedIndexQuery();
  });
})();
