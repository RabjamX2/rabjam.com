<script>
    const name = "Rabjam";
    const role = "Full-Stack Developer & Business Consultant";
    const bio =
        "Full-stack developer and business consultant. I build real-time web apps and games, advise startups on strategy and digital transformation.";

    const skills = [
        {
            label: "Languages",
            items: ["JavaScript", "TypeScript", "Python", "Lua", "C / C++", "Java"],
        },
        {
            label: "Frontend",
            items: ["SvelteKit", "React / Next.js", "Vue / Nuxt", "Tailwind CSS", "Three.js"],
        },
        {
            label: "Backend & Infra",
            items: ["Node.js", "Express", "Socket.io", "FastAPI", "Django", "Docker", "Linux"],
        },
        {
            label: "Databases & Cloud",
            items: ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Supabase", "Firebase", "AWS"],
        },
        {
            label: "Game Dev",
            items: ["Unity (C#)", "Roblox (Lua)"],
        },
        {
            label: "Business",
            items: [
                "Strategy & Operations",
                "Digital Transformation",
                "Startup Advisory",
                "Project Management",
                "Data Analysis",
            ],
        },
    ];

    const projects = [
        {
            title: "Multiplayer Poker",
            desc: "Real-time multiplayer poker game with Socket.io, Redis game state, Supabase auth, and a mobile-friendly SvelteKit UI.",
            tags: ["SvelteKit", "Socket.io", "Redis", "Supabase", "Express"],
            link: "/lobbies",
            linkLabel: "Play Now →",
            emoji: "🃏",
        },
        {
            title: "PokèGuesser",
            desc: "Guess the Pokémon (and Rainbow Six operators) from clues. A Wordle-style guessing game built in vanilla HTML, CSS, and JavaScript.",
            tags: ["HTML", "CSS", "JavaScript"],
            link: "/games/guesser-games",
            linkLabel: "Play Now →",
            emoji: "🎮",
        },
        {
            title: "Connect 4",
            desc: "Classic Connect 4 vs CPU or a friend online. Three AI difficulty levels with fork detection and positional scoring, plus persistent multiplayer rooms.",
            tags: ["SvelteKit", "Svelte 5", "Socket.io", "AI"],
            link: "/games/connect4?cpu",
            linkLabel: "vs CPU →",
            emoji: "🔴",
            secondaryLink: "/multiplayer",
            secondaryLabel: "Play Online →",
        },
        {
            title: "Minesweeper",
            desc: "Classic Minesweeper with solo play (Beginner / Intermediate / Expert) plus online PvP (take turns, private flags) and CO-OP (clear the board together).",
            tags: ["SvelteKit", "Svelte 5", "Socket.io"],
            link: "/games/minesweeper?solo",
            linkLabel: "Play Solo →",
            emoji: "💣",
            secondaryLink: "/multiplayer",
            secondaryLabel: "Play Online →",
        },
        {
            title: "Multiplayer Hub",
            desc: "Real-time game lobby — create or join a room, share a link, and challenge a friend. Persistent rooms survive reconnects, cookie-based identity, no account required.",
            tags: ["SvelteKit", "Socket.io", "Svelte 5"],
            link: "/multiplayer",
            linkLabel: "Open Hub →",
            emoji: "🎯",
        },
    ];

    const links = [
        { label: "GitHub", href: "https://github.com/RabjamX2", icon: "⌨" },
        // { label: "LinkedIn", href: "https://linkedin.com/", icon: "💼" },
    ];
</script>

<svelte:head>
    <title>{name} — Portfolio</title>
</svelte:head>

<div class="page">
    <!-- HERO -->
    <section class="hero">
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
    </section>

    <!-- SKILLS -->
    <section class="section">
        <h2 class="section-title">Skills</h2>
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
        <h2 class="section-title">Projects</h2>
        <div class="projects-grid">
            {#each projects as project}
                <div class="project-card">
                    <div class="project-emoji">{project.emoji}</div>
                    <h3 class="project-title">{project.title}</h3>
                    <p class="project-desc">{project.desc}</p>
                    <div class="project-tags">
                        {#each project.tags as tag}
                            <span class="tag">{tag}</span>
                        {/each}
                    </div>
                    <div class="project-actions">
                        {#if project.link}
                            <a class="project-link" href={project.link}>{project.linkLabel}</a>
                        {/if}
                        {#if project.secondaryLink}
                            <a class="project-link project-link-secondary" href={project.secondaryLink}
                                >{project.secondaryLabel}</a
                            >
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    </section>

    <!-- FOOTER -->
    <footer class="footer">
        <p>rabjam@rabjam.com</p>
    </footer>
</div>

<style>
    .page {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    /* ── HERO ── */
    .hero {
        width: 100%;
        display: flex;
        justify-content: center;
        padding: 5rem 1.5rem 4rem;
        background: radial-gradient(ellipse at 50% 0%, rgba(233, 69, 96, 0.12) 0%, transparent 65%), var(--bg);
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    .hero-content {
        max-width: 640px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 0.9rem;
    }
    .avatar {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        background: var(--accent);
        color: #fff;
        font-size: 2rem;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 0 4px rgba(233, 69, 96, 0.2);
    }
    .hero-name {
        font-size: 2.5rem;
        font-weight: 800;
        color: var(--text);
        line-height: 1;
    }
    .hero-role {
        font-size: 1rem;
        font-weight: 600;
        color: var(--accent2);
        letter-spacing: 0.03em;
    }
    .hero-bio {
        font-size: 0.95rem;
        color: var(--text-muted);
        line-height: 1.6;
        max-width: 480px;
    }
    .hero-links {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
        justify-content: center;
        margin-top: 0.4rem;
    }
    .hero-link {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.45rem 1rem;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: var(--radius);
        color: var(--text);
        text-decoration: none;
        font-size: 0.88rem;
        font-weight: 500;
        background: var(--surface);
        transition:
            border-color 0.2s,
            background 0.2s;
    }
    .hero-link:hover {
        border-color: var(--accent);
        background: rgba(233, 69, 96, 0.08);
    }

    /* ── SECTIONS ── */
    .section {
        width: 100%;
        max-width: 860px;
        padding: 3.5rem 1.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .section-title {
        font-size: 1.35rem;
        font-weight: 700;
        color: var(--text);
        margin-bottom: 1.75rem;
        padding-bottom: 0.6rem;
        border-bottom: 2px solid var(--accent);
        display: inline-block;
    }

    /* ── SKILLS ── */
    .skills-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.25rem;
    }
    .skill-group {
        background: var(--surface);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: var(--radius);
        padding: 1.1rem 1.25rem;
    }
    .skill-group-label {
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--accent2);
        font-weight: 700;
        margin-bottom: 0.8rem;
    }
    .skill-list {
        list-style: none;
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
    }
    .skill-tag {
        font-size: 0.8rem;
        padding: 0.25rem 0.65rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 999px;
        color: var(--text);
    }

    /* ── PROJECTS ── */
    .projects-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1.25rem;
    }
    .project-card {
        background: var(--surface);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: var(--radius);
        padding: 1.4rem 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
        transition:
            border-color 0.2s,
            box-shadow 0.2s;
    }
    .project-card:hover {
        border-color: rgba(233, 69, 96, 0.4);
        box-shadow: 0 4px 24px rgba(233, 69, 96, 0.08);
    }
    .project-emoji {
        font-size: 2rem;
        line-height: 1;
    }
    .project-title {
        font-size: 1.05rem;
        font-weight: 700;
        color: var(--text);
    }
    .project-desc {
        font-size: 0.85rem;
        color: var(--text-muted);
        line-height: 1.55;
        flex: 1;
    }
    .project-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
    }
    .tag {
        font-size: 0.72rem;
        padding: 0.2rem 0.55rem;
        background: rgba(245, 166, 35, 0.1);
        border: 1px solid rgba(245, 166, 35, 0.25);
        border-radius: 999px;
        color: var(--accent2);
    }
    .project-link {
        align-self: flex-start;
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--accent);
        text-decoration: none;
        margin-top: 0.2rem;
    }
    .project-link:hover {
        text-decoration: underline;
    }
    .project-actions {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        margin-top: 0.2rem;
    }
    .project-link-secondary {
        color: var(--accent2);
    }

    /* ── FOOTER ── */
    .footer {
        width: 100%;
        padding: 1.5rem;
        text-align: center;
        font-size: 0.78rem;
        color: var(--text-muted);
        opacity: 0.5;
    }
</style>
