<script>
    import { getContext } from "svelte";
    import { goto } from "$app/navigation";
    import { PUBLIC_API_URL } from "$lib/config";

    const name = "Rabjam";
    const role = "Full-Stack Software Engineer & Systems Architect";
    const bio =
        "Full-stack software engineer building real-time web applications, interactive multiplayer systems, and high-performance cloud infrastructure.";

    const skills = [
        {
            label: "Languages",
            items: ["JavaScript (ESNext)", "TypeScript", "Python", "Lua", "C / C++", "Java", "SQL"],
        },
        {
            label: "Frontend & UI",
            items: ["SvelteKit 5 (Runes)", "React / Next.js", "Vue / Nuxt", "Tailwind CSS", "Three.js"],
        },
        {
            label: "Backend & Systems",
            items: ["Node.js", "Express", "Socket.IO", "FastAPI", "Redis", "PM2", "Docker", "Linux (Ubuntu)"],
        },
        {
            label: "Databases & Cloud",
            items: ["PostgreSQL", "Supabase", "Prisma ORM", "CloudPanel", "Cloudflare CDN", "Hostinger VPS"],
        },
        {
            label: "DevOps & Tooling",
            items: ["GitHub Actions CI/CD", "Nginx Reverse Proxy", "OpenSSH", "UFW Firewall", "Git"],
        },
    ];

    const projects = [
        {
            title: "Multiplayer Poker & Casino Hub",
            desc: "Real-time multiplayer poker engine powered by Socket.io, Redis state management, Supabase Auth, Prisma ORM, and SvelteKit SSR.",
            tags: ["SvelteKit 5", "Socket.IO", "Redis", "Supabase", "Prisma", "Express"],
            link: "https://poker.rabjam.com",
            linkLabel: "Play Poker →",
            github: "https://github.com/RabjamX2/tibPoker",
            emoji: "🃏",
        },
        {
            title: "Connect 4 (AI & Online)",
            desc: "Classic Connect 4 featuring 3 AI difficulty engines with min-max fork detection and positional scoring, plus persistent WebSocket rooms.",
            tags: ["Svelte 5", "Socket.IO", "AI MinMax", "Express"],
            link: "/games/connect4?cpu",
            linkLabel: "vs CPU →",
            secondaryLink: "https://poker.rabjam.com/multiplayer",
            secondaryLabel: "Play Online →",
            github: "https://github.com/RabjamX2/connect4",
            emoji: "🔴",
        },
        {
            title: "Minesweeper Co-Op & PvP",
            desc: "Classic Minesweeper engine with solo modes plus real-time turn-based PvP and CO-OP multiplayer room synchronization.",
            tags: ["Svelte 5", "Socket.IO", "State Engine"],
            link: "/games/minesweeper?solo",
            linkLabel: "Play Solo →",
            secondaryLink: "https://poker.rabjam.com/multiplayer",
            secondaryLabel: "Play Online →",
            github: "https://github.com/RabjamX2/minesweeper",
            emoji: "💣",
        },
        {
            title: "Multiplayer Lobby Engine",
            desc: "Zero-friction room creation and discovery hub. Features persistent spectator support, cookie-based sessions, and guest instant play.",
            tags: ["Socket.IO", "SvelteKit", "Nginx"],
            link: "/multiplayer",
            linkLabel: "Open Hub →",
            github: "https://github.com/RabjamX2/multiplayer-hub",
            emoji: "🎯",
        },
        {
            title: "PokèGuesser & R6 Operator Guesser",
            desc: "Wordle-style deduction games with autocomplete, hint systems, and statistical tracking built in responsive vanilla JS & Svelte.",
            tags: ["JavaScript", "HTML5", "CSS3", "REST API"],
            link: "/games/guesser-games",
            linkLabel: "Play Guesser →",
            github: "https://github.com/RabjamX2/PokeGuesser/tree/javascript",
            emoji: "🎮",
        },
    ];

    const links = [
        { label: "GitHub Profile", href: "https://github.com/RabjamX2", icon: "⌨" },
        { label: "Email Contact", href: "mailto:rabjam@rabjam.com", icon: "✉" },
    ];
</script>

<svelte:head>
    <title>{name} — Full-Stack Portfolio & Projects</title>
</svelte:head>

<div class="page">
    <!-- HERO -->
    <header class="hero">
        <div class="hero-content">
            <div class="avatar">{name[0]}</div>
            <h1 class="hero-name">{name}</h1>
            <p class="hero-role">{role}</p>
            <p class="hero-bio">{bio}</p>
            <div class="hero-links">
                {#each links as { label, href, icon }}
                    <a class="hero-link" {href} target="_blank" rel="noopener">{icon} {label}</a>
                {/each}
            </div>
        </div>
    </header>

    <!-- SKILLS -->
    <section class="section">
        <h2 class="section-title">Technical Stack & Skills</h2>
        <div class="skills-grid">
            {#each skills as { label, items }}
                <div class="skill-group">
                    <h3 class="skill-group-label">{label}</h3>
                    <ul class="skill-list">
                        {#each items as item}
                            <li class="skill-tag">{item}</li>
                        {/each}
                    </ul>
                </div>
            {/each}
        </div>
    </section>

    <!-- PROJECTS -->
    <section class="section">
        <h2 class="section-title">Live Interactive Showcase Projects</h2>
        <div class="projects-grid">
            {#each projects as project}
                <div class="project-card">
                    <div class="project-header">
                        <span class="project-emoji">{project.emoji}</span>
                        <h3 class="project-title">{project.title}</h3>
                    </div>
                    <p class="project-desc">{project.desc}</p>
                    <div class="project-tags">
                        {#each project.tags as tag}
                            <span class="tag">{tag}</span>
                        {/each}
                    </div>
                    <div class="project-actions">
                        {#if project.link}
                            <a class="project-btn" href={project.link}>{project.linkLabel}</a>
                        {/if}
                        {#if project.secondaryLink}
                            <a class="project-btn project-btn-secondary" href={project.secondaryLink}
                                >{project.secondaryLabel}</a
                            >
                        {/if}
                        {#if project.github}
                            <a class="project-github" href={project.github} target="_blank" rel="noopener">Code ↗</a>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    </section>

    <!-- FOOTER -->
    <footer class="footer">
        <p>© {new Date().getFullYear()} {name} • Built with SvelteKit 5, Node.js & CloudPanel VPS</p>
    </footer>
</div>

<style>
    .page {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        background-color: var(--bg, #0f172a);
        color: var(--text, #f8fafc);
        font-family: system-ui, -apple-system, sans-serif;
    }

    /* ── HERO ── */
    .hero {
        width: 100%;
        display: flex;
        justify-content: center;
        padding: 5rem 1.5rem 4rem;
        background: radial-gradient(ellipse at 50% 0%, rgba(233, 69, 96, 0.15) 0%, transparent 70%), var(--bg, #0f172a);
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .hero-content {
        max-width: 680px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 1rem;
    }
    .avatar {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: #e94560;
        color: #fff;
        font-size: 2.2rem;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 24px rgba(233, 69, 96, 0.35);
    }
    .hero-name {
        font-size: 2.6rem;
        font-weight: 800;
        letter-spacing: -0.02em;
    }
    .hero-role {
        font-size: 1.05rem;
        font-weight: 600;
        color: #00fff5;
        letter-spacing: 0.02em;
    }
    .hero-bio {
        font-size: 0.98rem;
        color: #94a3b8;
        line-height: 1.6;
        max-width: 520px;
    }
    .hero-links {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
        justify-content: center;
        margin-top: 0.5rem;
    }
    .hero-link {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.5rem 1.1rem;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 8px;
        color: #fff;
        text-decoration: none;
        font-size: 0.9rem;
        font-weight: 500;
        background: rgba(255, 255, 255, 0.04);
        transition: all 0.2s ease;
    }
    .hero-link:hover {
        border-color: #e94560;
        background: rgba(233, 69, 96, 0.12);
    }

    /* ── SECTIONS ── */
    .section {
        width: 100%;
        max-width: 900px;
        padding: 3.5rem 1.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .section-title {
        font-size: 1.4rem;
        font-weight: 700;
        color: #fff;
        margin-bottom: 1.75rem;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid #e94560;
        display: inline-block;
    }

    /* ── SKILLS ── */
    .skills-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 1.25rem;
    }
    .skill-group {
        background: rgba(30, 41, 59, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        padding: 1.2rem;
    }
    .skill-group-label {
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #00fff5;
        font-weight: 700;
        margin-bottom: 0.8rem;
    }
    .skill-list {
        list-style: none;
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
        padding: 0;
        margin: 0;
    }
    .skill-tag {
        font-size: 0.82rem;
        padding: 0.25rem 0.7rem;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 999px;
        color: #cbd5e1;
    }

    /* ── PROJECTS ── */
    .projects-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1.5rem;
    }
    .project-card {
        background: rgba(30, 41, 59, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
        transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .project-card:hover {
        transform: translateY(-3px);
        border-color: rgba(233, 69, 96, 0.5);
    }
    .project-header {
        display: flex;
        align-items: center;
        gap: 0.6rem;
    }
    .project-emoji {
        font-size: 1.8rem;
    }
    .project-title {
        font-size: 1.1rem;
        font-weight: 700;
        color: #fff;
    }
    .project-desc {
        font-size: 0.88rem;
        color: #94a3b8;
        line-height: 1.55;
        flex: 1;
    }
    .project-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
    }
    .tag {
        font-size: 0.75rem;
        padding: 0.2rem 0.6rem;
        background: rgba(0, 255, 245, 0.08);
        border: 1px solid rgba(0, 255, 245, 0.2);
        border-radius: 999px;
        color: #00fff5;
    }
    .project-actions {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        flex-wrap: wrap;
        margin-top: 0.4rem;
    }
    .project-btn {
        font-size: 0.85rem;
        font-weight: 600;
        padding: 0.45rem 0.9rem;
        background: #e94560;
        color: #fff;
        border-radius: 6px;
        text-decoration: none;
        transition: opacity 0.2s;
    }
    .project-btn:hover {
        opacity: 0.9;
    }
    .project-btn-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
    }
    .project-github {
        margin-left: auto;
        font-size: 0.82rem;
        color: #94a3b8;
        text-decoration: none;
    }
    .project-github:hover {
        color: #fff;
        text-decoration: underline;
    }

    /* ── FOOTER ── */
    .footer {
        width: 100%;
        padding: 2rem 1.5rem;
        text-align: center;
        font-size: 0.82rem;
        color: #64748b;
    }
</style>
