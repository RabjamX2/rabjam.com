<script>
    const name = "Rabjam";
    const role = "Business Consultant, Digital Strategist & Technical Advisor";
    const bio =
        "Advising startups, SMBs, and scaling ventures on digital transformation, system architecture, and strategic growth. Bridging high-level business strategy with deep technical execution.";

    const services = [
        {
            label: "Strategy & Operations",
            items: [
                "Startup Strategy & Advisory",
                "Business Model Innovation",
                "Go-to-Market (GTM) Strategy",
                "Operational Process Optimization",
                "Growth & Scaling Roadmaps",
            ],
        },
        {
            label: "Digital Transformation",
            items: [
                "Legacy System Modernization",
                "Cloud Migration Strategy",
                "Workflow Automation",
                "Digital Process Optimization",
                "Toolchain Standardization",
            ],
        },
        {
            label: "Technical & Systems Advisory",
            items: [
                "System Architecture Audits",
                "Technical Due Diligence",
                "Tech Stack Selection",
                "API & Microservices Strategy",
                "Infrastructure Optimization",
            ],
        },
        {
            label: "Product & Data Insights",
            items: [
                "Product Scoping & Roadmapping",
                "MVP Definition & Rapid Prototyping",
                "KPI & Business Intelligence",
                "User Analytics & Funnel Optimization",
                "Data-Driven Decision Making",
            ],
        },
        {
            label: "Delivery & Execution",
            items: [
                "Agile / Scrum Leadership",
                "Cross-Functional Coordination",
                "Technical Scoping & Estimation",
                "Vendor & Partner Management",
                "Risk Assessment & Mitigation",
            ],
        },
    ];

    const caseStudies = [
        {
            title: "Digital Transformation & Cloud Infrastructure Advisory",
            desc: "Guided traditional business workflows into modern cloud-native architectures. Designed containerized microservices and automated deployment pipelines, cutting server infrastructure costs by 40% while improving system uptime.",
            tags: ["Digital Transformation", "Cloud Infrastructure", "Cost Optimization", "DevOps"],
            emoji: "☁️",
            impact: "40% Cost Reduction & 99.9% Uptime",
        },
        {
            title: "Startup MVP Strategy & Rapid Product Delivery",
            desc: "Advised early-stage founders on product roadmap definition, core feature prioritization, and lean MVP development. Reduced initial time-to-market from 6 months to 6 weeks using modern web technologies.",
            tags: ["Startup Advisory", "MVP Strategy", "Rapid Prototyping", "Product Management"],
            emoji: "🚀",
            impact: "6-Week Time-to-Market Acceleration",
        },
        {
            title: "High-Concurrency Real-Time System Architecture",
            desc: "Engineered and consulted on high-throughput, low-latency WebSocket communication platforms for multi-user applications. Designed state synchronization protocols using Redis and SvelteKit.",
            tags: ["System Architecture", "Real-Time Systems", "WebSockets", "Performance Tuning"],
            emoji: "⚡",
            impact: "Sub-50ms Latency & High Scalability",
        },
        {
            title: "Process Automation & Data Analytics Integration",
            desc: "Built custom automated data pipelines and analytics dashboards to streamline operational reporting, enabling leadership teams to make real-time data-driven business decisions.",
            tags: ["Workflow Automation", "Business Intelligence", "Data Analytics", "Process Audit"],
            emoji: "📊",
            impact: "Automated Weekly Reporting Workflows",
        },
    ];

    const links = [
        { label: "Engineering Showcase", href: "/", icon: "⚡", internal: true },
        { label: "GitHub Profile", href: "https://github.com/RabjamX2", icon: "⌨" },
        { label: "Email Contact", href: "mailto:rabjam@rabjam.com", icon: "✉" },
    ];
</script>

<svelte:head>
    <title>{name} — Business Consulting & Digital Advisory</title>
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
                {#each links as { label, href, icon, internal }}
                    {#if internal}
                        <a class="hero-link hero-link-accent" {href}>{icon} {label}</a>
                    {:else}
                        <a class="hero-link" {href} target="_blank" rel="noopener">{icon} {label}</a>
                    {/if}
                {/each}
            </div>
        </div>
    </section>

    <!-- ADVISORY SERVICES & COMPETENCIES -->
    <section class="section">
        <h2 class="section-title">Consulting Services & Strategic Competencies</h2>
        <div class="skills-grid">
            {#each services as { label, items }}
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

    <!-- CASE STUDIES / ENGAGEMENTS -->
    <section class="section">
        <h2 class="section-title">Strategic Engagements & Case Studies</h2>
        <div class="projects-grid">
            {#each caseStudies as study}
                <div class="project-card">
                    <div class="project-header">
                        <span class="project-emoji">{study.emoji}</span>
                        <h3 class="project-title">{study.title}</h3>
                    </div>
                    <p class="project-desc">{study.desc}</p>
                    {#if study.impact}
                        <div class="impact-badge">
                            <span>🎯 {study.impact}</span>
                        </div>
                    {/if}
                    <div class="project-tags">
                        {#each study.tags as tag}
                            <span class="tag">{tag}</span>
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
    </section>

    <!-- FOOTER -->
    <footer class="footer">
        <p>rabjam@rabjam.com • Business Consulting & Digital Strategy Advisory</p>
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
        background: radial-gradient(ellipse at 50% 0%, rgba(245, 166, 35, 0.12) 0%, transparent 65%), var(--bg);
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
        background: var(--accent2);
        color: #111;
        font-size: 2rem;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 0 4px rgba(245, 166, 35, 0.25);
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
        max-width: 520px;
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
        border-color: var(--accent2);
        background: rgba(245, 166, 35, 0.08);
    }
    .hero-link-accent {
        border-color: rgba(245, 166, 35, 0.4);
        color: var(--accent2);
        background: rgba(245, 166, 35, 0.08);
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
        border-bottom: 2px solid var(--accent2);
        display: inline-block;
    }

    /* ── SKILLS / SERVICES ── */
    .skills-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
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
        flex-direction: column;
        gap: 0.45rem;
    }
    .skill-tag {
        font-size: 0.82rem;
        padding: 0.35rem 0.75rem;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 6px;
        color: var(--text);
    }

    /* ── CASE STUDIES / PROJECTS ── */
    .projects-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
        gap: 1.25rem;
    }
    @media (max-width: 640px) {
        .projects-grid {
            grid-template-columns: 1fr;
        }
    }
    .project-card {
        background: var(--surface);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: var(--radius);
        padding: 1.4rem 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        transition:
            border-color 0.2s,
            box-shadow 0.2s;
    }
    .project-card:hover {
        border-color: rgba(245, 166, 35, 0.4);
        box-shadow: 0 4px 24px rgba(245, 166, 35, 0.08);
    }
    .project-header {
        display: flex;
        align-items: center;
        gap: 0.6rem;
    }
    .project-emoji {
        font-size: 1.6rem;
        line-height: 1;
    }
    .project-title {
        font-size: 1.05rem;
        font-weight: 700;
        color: var(--text);
    }
    .project-desc {
        font-size: 0.88rem;
        color: var(--text-muted);
        line-height: 1.55;
        flex: 1;
    }
    .impact-badge {
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--accent2);
        background: rgba(245, 166, 35, 0.1);
        border: 1px solid rgba(245, 166, 35, 0.25);
        padding: 0.35rem 0.75rem;
        border-radius: 6px;
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        width: fit-content;
    }
    .project-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        margin-top: 0.2rem;
    }
    .tag {
        font-size: 0.72rem;
        padding: 0.2rem 0.55rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 999px;
        color: var(--text-muted);
    }

    /* ── FOOTER ── */
    .footer {
        padding: 3rem 1.5rem;
        color: var(--text-muted);
        font-size: 0.85rem;
        text-align: center;
    }
</style>
