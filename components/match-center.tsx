"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity, ArrowDownUp, ArrowRight, Bell, CalendarDays, ChevronDown,
  CircleHelp, Clock3, Globe2, Heart, House, Menu, Moon, Radio,
  Search, Settings2, Shield, SlidersHorizontal, Sparkles, Star,
  Sun, Trophy, X,
} from "lucide-react";
import { previewMatches, previewStandings } from "@/lib/sports/preview";
import type { FeedResponse, Sport, SportMatch } from "@/lib/sports/types";

export type MatchCenterSection =
  | "home" | "cricket" | "cricket-live" | "cricket-series" | "cricket-match"
  | "football" | "football-live" | "football-leagues" | "football-match"
  | "football-standings" | "search" | "favorites" | "settings";

interface Props {
  section: MatchCenterSection;
  matchId?: string;
  leagueId?: string;
}

const navPrimary = [
  { href: "/", label: "Home", icon: House },
  { href: "/cricket", label: "Cricket", icon: Activity },
  { href: "/football", label: "Football", icon: Globe2 },
  { href: "/favorites", label: "Favorites", icon: Heart },
];

const cricketLinks = [
  { href: "/cricket/live", label: "Live scores" },
  { href: "/cricket/series", label: "Series & tournaments" },
];

const footballLinks = [
  { href: "/football/live", label: "Live scores" },
  { href: "/football/leagues", label: "Leagues & tables" },
];

const leagueOptions = [
  { code: "PL", name: "Premier League" },
  { code: "PD", name: "La Liga" },
  { code: "BL1", name: "Bundesliga" },
  { code: "SA", name: "Serie A" },
  { code: "FL1", name: "Ligue 1" },
  { code: "CL", name: "Champions League" },
];

function isActive(section: MatchCenterSection, href: string) {
  if (href === "/") return section === "home";
  return section === href.slice(1) || section.startsWith(href.slice(1) + "-");
}

function matchHref(match: SportMatch) {
  return `/${match.sport}/match/${encodeURIComponent(match.id)}`;
}

function MatchCard({
  match,
  favorite,
  onFavorite,
}: {
  match: SportMatch;
  favorite: boolean;
  onFavorite: (match: SportMatch) => void;
}) {
  const isLive = match.status === "live";
  return (
    <article className="match-card">
      <div className="match-card-head">
        <Link className="competition-name" href={matchHref(match)}>
          <span className={`sport-dot ${match.sport}`} />
          {match.competition}
        </Link>
        <button
          className={`icon-button favorite-button ${favorite ? "selected" : ""}`}
          aria-label={favorite ? `Remove ${match.homeTeam} from favorites` : `Favorite ${match.homeTeam}`}
          aria-pressed={favorite}
          onClick={() => onFavorite(match)}
        >
          <Star size={16} fill={favorite ? "currentColor" : "none"} />
        </button>
      </div>
      <Link className="match-card-main" href={matchHref(match)}>
        <div className="match-teams">
          <TeamLine name={match.homeTeam} code={match.homeCode} />
          <TeamLine name={match.awayTeam} code={match.awayCode} />
        </div>
        <div className="match-score-column">
          <span className={isLive ? "score live-score" : "score"}>
            {match.homeScore ?? (match.status === "scheduled" ? "—" : "")}
          </span>
          <span className={isLive ? "score live-score" : "score"}>
            {match.awayScore ?? (match.status === "scheduled" ? "—" : "")}
          </span>
        </div>
      </Link>
      <div className="match-card-foot">
        <span className={`match-state ${isLive ? "live" : match.status}`}>
          {isLive && <span className="live-pulse" />}
          {match.statusText}
        </span>
        <span className="match-detail">
          {match.stage ?? match.venue ?? (match.status === "finished" ? "Result" : "")}
        </span>
        {match.source === "preview" && <span className="preview-inline">PREVIEW</span>}
        <Link href={matchHref(match)} className="match-open" aria-label={`Open ${match.homeTeam} vs ${match.awayTeam}`}>
          <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  );
}

function TeamLine({ name, code }: { name: string; code?: string }) {
  return (
    <div className="team-line">
      <span className="team-mark" aria-hidden="true">{code?.slice(0, 3) || name.slice(0, 2).toUpperCase()}</span>
      <span className="team-name">{name}</span>
    </div>
  );
}

function SideNav({
  section,
  favoriteCount,
}: {
  section: MatchCenterSection;
  favoriteCount: number;
}) {
  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="sidebar-heading">MENU</div>
      <nav className="side-nav">
        {navPrimary.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={`nav-link ${isActive(section, href) ? "active" : ""}`}>
            <Icon size={17} strokeWidth={1.8} />
            <span>{label}</span>
            {href === "/favorites" && favoriteCount > 0 && <small>{favoriteCount}</small>}
          </Link>
        ))}
      </nav>
      <div className="sidebar-heading subheading">CRICKET</div>
      <nav className="side-nav compact-nav">
        {cricketLinks.map(({ href, label }) => (
          <Link key={href} href={href} className={`nav-link ${isActive(section, href) ? "active" : ""}`}>
            <span className="nav-bullet" />{label}
          </Link>
        ))}
      </nav>
      <div className="sidebar-heading subheading">FOOTBALL</div>
      <nav className="side-nav compact-nav">
        {footballLinks.map(({ href, label }) => (
          <Link key={href} href={href} className={`nav-link ${isActive(section, href) ? "active" : ""}`}>
            <span className="nav-bullet" />{label}
          </Link>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <Link href="/settings" className={`nav-link ${section === "settings" ? "active" : ""}`}>
          <Settings2 size={17} strokeWidth={1.8} /><span>Settings</span>
        </Link>
        <div className="sidebar-note">
          <span className="note-icon"><CircleHelp size={16} /></span>
          <p>Scores and schedules from your selected providers.</p>
        </div>
      </div>
    </aside>
  );
}

function StatusTabs({ selected, onChange }: { selected: string; onChange: (value: string) => void }) {
  const tabs = [
    ["all", "All matches"],
    ["live", "Live"],
    ["scheduled", "Upcoming"],
    ["finished", "Results"],
  ];
  return (
    <div className="status-tabs" role="tablist" aria-label="Filter matches by status">
      {tabs.map(([value, label]) => (
        <button
          className={`status-tab ${selected === value ? "active" : ""}`}
          key={value}
          role="tab"
          aria-selected={selected === value}
          onClick={() => onChange(value)}
        >
          {value === "live" && <span className="tiny-live-dot" />}
          {label}
        </button>
      ))}
    </div>
  );
}

function StandingsPreview() {
  return (
    <section className="panel standings-panel">
      <div className="panel-heading">
        <div><span className="eyebrow">TABLE PREVIEW</span><h2>League standings</h2></div>
        <Trophy size={18} />
      </div>
      <p className="muted-copy">Example table only. A configured provider is required for current standings.</p>
      <div className="table-scroll">
        <table>
          <thead><tr><th>#</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>Pts</th></tr></thead>
          <tbody>{previewStandings.map((row) => (
            <tr key={row.position}>
              <td>{row.position}</td><td className="standings-team">{row.team}</td><td>{row.played}</td>
              <td>{row.won}</td><td>{row.drawn}</td><td>{row.lost}</td><td className="points">{row.points}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <span className="preview-tag">SAMPLE PREVIEW</span>
    </section>
  );
}

function SettingsPanel({
  interval,
  setInterval,
  darkMode,
  setDarkMode,
}: {
  interval: number;
  setInterval: (value: number) => void;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}) {
  return (
    <section className="settings-list">
      <article className="settings-row">
        <div className="settings-icon"><Clock3 size={18} /></div>
        <div className="settings-copy"><strong>Refresh interval</strong><span>Live feeds refresh only while this page is visible.</span></div>
        <label className="select-wrap">
          <span className="sr-only">Refresh interval</span>
          <select value={interval} onChange={(event) => setInterval(Number(event.target.value))}>
            <option value={5}>5 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
          </select><ChevronDown size={14} />
        </label>
      </article>
      <article className="settings-row">
        <div className="settings-icon">{darkMode ? <Moon size={18} /> : <Sun size={18} />}</div>
        <div className="settings-copy"><strong>Appearance</strong><span>Choose a comfortable viewing theme.</span></div>
        <button className={`toggle-switch ${darkMode ? "on" : ""}`} role="switch" aria-checked={darkMode} onClick={() => setDarkMode(!darkMode)}>
          <span />
        </button>
      </article>
      <article className="provider-settings">
        <span className="eyebrow">DATA PROVIDERS</span>
        <h3>Keep your API keys private</h3>
        <p>Add keys to <code>.env.local</code> in the project root. They are only read by server routes and are never sent to the browser.</p>
        <div className="provider-env"><span>CRICKET_API_KEY</span><span>Football • football-data.org</span></div>
        <div className="provider-env"><span>FOOTBALL_DATA_API_KEY</span><span>Cricket • cricketdata.org</span></div>
        <Link href="#setup-guide" className="text-link">Read setup instructions <ArrowRight size={14} /></Link>
        <div id="setup-guide" className="setup-guide">
          <p><strong>Cricket:</strong> create a key at <a href="https://cricketdata.org/" target="_blank" rel="noreferrer">cricketdata.org</a>, then add <code>CRICKET_API_KEY=your_key</code>.</p>
          <p><strong>Football:</strong> register at <a href="https://www.football-data.org/client/register" target="_blank" rel="noreferrer">football-data.org</a>, then add <code>FOOTBALL_DATA_API_KEY=your_token</code>.</p>
          <p>Restart the dev server after saving. Free plans may restrict competitions and request volume.</p>
        </div>
      </article>
    </section>
  );
}

export function MatchCenter({ section, matchId, leagueId }: Props) {
  const router = useRouter();
  const [matches, setMatches] = useState<SportMatch[]>(previewMatches);
  const [feedStatus, setFeedStatus] = useState<"preview" | "loading" | "provider" | "error">("preview");
  const [feedMessage, setFeedMessage] = useState("Sample preview data — connect an API for real scores.");
  const [lastUpdated, setLastUpdated] = useState<string>();
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sportFilter, setSportFilter] = useState<"all" | Sport>("all");
  const [competitionFilter, setCompetitionFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [refreshMinutes, setRefreshMinutes] = useState(30);
  const [darkMode, setDarkMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState("Today");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setNow(new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }));
      try {
        const savedFavorites: unknown = JSON.parse(localStorage.getItem("matchday:favorites") ?? "[]");
        if (Array.isArray(savedFavorites) && savedFavorites.every((item) => typeof item === "string")) {
          setFavorites(savedFavorites);
        }
        const savedInterval = Number(localStorage.getItem("matchday:refresh"));
        if ([5, 15, 30].includes(savedInterval)) setRefreshMinutes(savedInterval);
        setDarkMode(localStorage.getItem("matchday:theme") === "dark");
      } catch {
        setFavorites([]);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    localStorage.setItem("matchday:theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const fetchFeeds = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const sports: Sport[] =
        section.startsWith("cricket") ? ["cricket"] :
          section.startsWith("football") ? ["football"] : ["cricket", "football"];
      const results = await Promise.all(sports.map(async (sport) => {
        const response = await fetch(`/api/${sport}/live`, { cache: "no-store" });
        const body = await response.json() as FeedResponse & { error?: string };
        if (!response.ok) throw new Error(body.error ?? `Unable to refresh ${sport} matches.`);
        return body;
      }));
      const configured = results.some((result) => result.configured);
      if (configured) {
        setMatches(results.flatMap((result) => result.matches));
        setFeedStatus("provider");
        setFeedMessage(results.map((result) => result.message).filter(Boolean).join(" "));
      } else {
        setMatches(previewMatches);
        setFeedStatus("preview");
        setFeedMessage("Sample preview data — add provider keys in Settings for real scores.");
      }
      setLastUpdated(new Date().toISOString());
    } catch (error) {
      setFeedStatus("error");
      setFeedMessage(error instanceof Error ? error.message : "Unable to refresh match feeds.");
    } finally {
      setRefreshing(false);
    }
  }, [section]);

  useEffect(() => {
    if (section === "settings" || section === "cricket-series" || section === "football-leagues" || section === "football-standings") return;
    const timer = window.setTimeout(() => void fetchFeeds(true), 0);
    return () => window.clearTimeout(timer);
  }, [fetchFeeds, section]);

  useEffect(() => {
    if (feedStatus !== "provider") return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void fetchFeeds(true);
    }, refreshMinutes * 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void fetchFeeds(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [feedStatus, fetchFeeds, refreshMinutes]);

  useEffect(() => {
    localStorage.setItem("matchday:favorites", JSON.stringify(favorites));
  }, [favorites]);
  useEffect(() => {
    localStorage.setItem("matchday:refresh", String(refreshMinutes));
  }, [refreshMinutes]);

  const toggleFavorite = (match: SportMatch) => {
    const key = `${match.sport}:${match.homeTeam}:${match.awayTeam}`;
    setFavorites((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  };
  const isFavorite = (match: SportMatch) => favorites.includes(`${match.sport}:${match.homeTeam}:${match.awayTeam}`);

  const sectionTitle: Record<MatchCenterSection, string> = {
    home: "Today’s matches",
    cricket: "Cricket",
    "cricket-live": "Live cricket",
    "cricket-series": "Cricket series",
    "cricket-match": "Cricket match centre",
    football: "Football",
    "football-live": "Live football",
    "football-leagues": "Leagues & tables",
    "football-match": "Football match centre",
    "football-standings": "League standings",
    search: "Search matches",
    favorites: "Your favorites",
    settings: "Settings",
  };
  const selectedSport: Sport | undefined =
    section.startsWith("cricket") ? "cricket" :
      section.startsWith("football") ? "football" : undefined;

  const sections = useMemo(() => {
    let filtered = matches;
    if (selectedSport) filtered = filtered.filter((match) => match.sport === selectedSport);
    if (section === "cricket-live" || section === "football-live") filtered = filtered.filter((match) => match.status === "live");
    if (section === "search" && query.trim()) {
      const needle = query.toLowerCase();
      filtered = filtered.filter((match) => `${match.homeTeam} ${match.awayTeam} ${match.competition}`.toLowerCase().includes(needle));
    }
    if (section === "favorites") {
      filtered = filtered.filter((match) =>
        favorites.includes(`${match.sport}:${match.homeTeam}:${match.awayTeam}`),
      );
    }
    if (section === "home" || section === "cricket" || section === "football" || section === "favorites" || section === "search") {
      if (selectedStatus !== "all") filtered = filtered.filter((match) => match.status === selectedStatus);
    }
    if (sportFilter !== "all") filtered = filtered.filter((match) => match.sport === sportFilter);
    if (competitionFilter !== "all") filtered = filtered.filter((match) => match.competition === competitionFilter);
    return filtered;
  }, [competitionFilter, favorites, matches, query, section, selectedSport, selectedStatus, sportFilter]);

  const competitions = Array.from(new Set(matches.map((match) => match.competition))).sort();
  const currentMatch = matchId ? matches.find((match) => match.id === matchId) : undefined;
  const pageLabel = sectionTitle[section];

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (section !== "search") router.push("/search");
    setQuery(searchInput.trim());
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Matchday home">
          <span className="brand-mark"><Activity size={19} strokeWidth={2.6} /></span>
          <span>match<span>day</span></span>
          <small>SPORTS DESK</small>
        </Link>
        <div className="topbar-actions">
          <form className="search-box" onSubmit={submitSearch}>
            <Search size={16} />
            <input aria-label="Search teams and competitions" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search teams, leagues..." />
            {searchInput && <button type="button" className="search-clear" aria-label="Clear search" onClick={() => setSearchInput("")}><X size={14} /></button>}
            <kbd>↵</kbd>
          </form>
          <span className="topbar-divider" />
          <button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /></button>
          <Link className="avatar" href="/settings" aria-label="Open settings">M</Link>
        </div>
      </header>
      <div className="layout">
        <SideNav section={section} favoriteCount={favorites.length} />
        <main className="main-content">
          <div className="page-topline">
            <div className="breadcrumbs"><Link href="/">Home</Link><span>/</span><span>{pageLabel}</span></div>
            <div className="current-date"><CalendarDays size={14} />{now || "Today"}</div>
          </div>

          {section === "settings" ? (
            <div className="page-heading settings-heading">
              <div><span className="eyebrow">YOUR PREFERENCES</span><h1>{pageLabel}</h1><p>Make Matchday feel right for you. These choices stay in this browser.</p></div>
              <div className="heading-mark"><Settings2 size={22} /></div>
              <SettingsPanel interval={refreshMinutes} setInterval={setRefreshMinutes} darkMode={darkMode} setDarkMode={setDarkMode} />
            </div>
          ) : section === "football-leagues" || section === "football-standings" ? (
            <div className="page-heading">
              <div><span className="eyebrow">FOOTBALL / COMPETITIONS</span><h1>{leagueOptions.find((league) => league.code === leagueId)?.name ?? pageLabel}</h1><p>Pick a competition to see its table. What’s available depends on your data provider.</p></div>
              <div className="heading-mark"><Trophy size={22} /></div>
              {section === "football-leagues" ? (
                <div className="league-grid">
                  {leagueOptions.map((league) => (
                    <Link href={`/football/standings/${league.code}`} className="league-card" key={league.code}>
                      <span className="league-emblem"><Trophy size={17} /></span><span><strong>{league.name}</strong><small>{league.code} · coverage depends on your plan</small></span><ArrowRight size={16} />
                    </Link>
                  ))}
                </div>
              ) : <StandingsPreview />}
            </div>
          ) : section === "cricket-series" ? (
            <div className="page-heading">
              <div><span className="eyebrow">CRICKET / COMPETITIONS</span><h1>{pageLabel}</h1><p>Keep up with the tournaments and series on your calendar.</p></div>
              <div className="notice-card"><Sparkles size={17} /><span>Series schedules aren’t available from your current feed yet. Add a provider key to see what it covers.</span><Link href="/settings">Set up data <ArrowRight size={14} /></Link></div>
              <div className="empty-state"><div className="empty-icon"><Trophy size={22} /></div><h2>Your next series starts here</h2><p>Connect a cricket data provider and we’ll show the series it supports.</p><Link href="/settings" className="primary-button">Connect cricket data</Link></div>
            </div>
          ) : section === "cricket-match" || section === "football-match" ? (
            <div className="page-heading match-detail-page">
              <div><span className="eyebrow">{currentMatch?.competition ?? "MATCH CENTRE"}</span><h1>{currentMatch ? `${currentMatch.homeTeam} vs ${currentMatch.awayTeam}` : "Match details"}</h1><p>{currentMatch?.stage ?? "This fixture may have moved out of the current feed."}</p></div>
              <div className="heading-mark"><Activity size={22} /></div>
              {currentMatch ? (
                <>
                  <div className="detail-scoreboard">
                    <div><TeamLine name={currentMatch.homeTeam} code={currentMatch.homeCode} /><strong>{currentMatch.homeScore ?? "—"}</strong></div>
                    <span className={`detail-status ${currentMatch.status}`}>{currentMatch.statusText}</span>
                    <div><TeamLine name={currentMatch.awayTeam} code={currentMatch.awayCode} /><strong>{currentMatch.awayScore ?? "—"}</strong></div>
                    {currentMatch.venue && <small>{currentMatch.venue}</small>}
                  </div>
                  <div className="detail-unavailable"><CircleHelp size={18} /><span>This feed doesn’t include the full scorecard, commentary, lineups, or match stats. We’ll show more here when your provider makes them available.</span></div>
                  <Link className="text-link" href={`/${currentMatch.sport}`}>Browse more {currentMatch.sport} matches <ArrowRight size={14} /></Link>
                </>
              ) : (
                <div className="empty-state"><div className="empty-icon"><Search size={22} /></div><h2>Match not found in the current feed</h2><p>It may have ended or is not available from the configured provider.</p><Link href="/" className="primary-button">Back to scores</Link></div>
              )}
            </div>
          ) : (
            <>
              <section className="hero">
                <div className="hero-content">
                  <div className="hero-kicker"><span className="hero-kicker-icon"><Radio size={14} /></span> {section === "search" ? "A QUICK WAY TO FIND IT" : section === "favorites" ? "MADE FOR THE TEAMS YOU LOVE" : section === "home" ? "A LITTLE CLOSER TO THE GAME" : "FOLLOW ALONG, YOUR WAY"}</div>
                  <h1>{section === "search" ? "Find your next fixture." : section === "favorites" ? "Your teams, right here." : section === "home" ? "There’s always a game on." : pageLabel}</h1>
                  <p>{section === "search" ? "Look up a team, competition, or match." : section === "favorites" ? "Star a match and it’ll be waiting here next time." : section.startsWith("cricket") ? "From the first ball to the final result, catch up on the cricket you follow." : section.startsWith("football") ? "Follow fixtures, check the score, and keep an eye on the competitions you love." : "The scores you care about, with a little more of the story around them."}</p>
                  {section === "search" && <form className="hero-search" onSubmit={submitSearch}><Search size={17} /><input autoFocus aria-label="Search matches" placeholder="Try “Arsenal” or “Premier League”" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} /><button className="primary-button">Search</button></form>}
                  {section !== "search" && section !== "favorites" && (
                    <div className="hero-links">
                      <Link href="/cricket/live"><span className="hero-live-dot" />Cricket live <ArrowRight size={13} /></Link>
                      <Link href="/football/live"><span className="hero-live-dot" />Football live <ArrowRight size={13} /></Link>
                    </div>
                  )}
                </div>
                <div className="hero-art" aria-hidden="true">
                  <div className="orbit orbit-one" /><div className="orbit orbit-two" />
                  <div className="hero-ball"><Activity size={43} strokeWidth={1.3} /></div>
                  <div className="floating-score score-one"><span>NEP</span><b>142/5</b><small>17.2 OV</small></div>
                  <div className="floating-score score-two"><span>ARS</span><b>1 — 1</b><small>62′ LIVE</small></div>
                </div>
              </section>

              <div className={`feed-banner ${feedStatus}`}>
                <span className="feed-indicator">{feedStatus === "provider" ? <Shield size={14} /> : feedStatus === "error" ? <CircleHelp size={14} /> : <Sparkles size={14} />}</span>
                <span><strong>{feedStatus === "provider" ? "Provider data" : feedStatus === "error" ? "Feed unavailable" : "Sample preview"}</strong> · {feedMessage}</span>
                <button onClick={() => void fetchFeeds()} disabled={refreshing} className="refresh-button"><ArrowDownUp size={13} />{refreshing ? "Updating" : "Refresh"}</button>
              </div>

              <section className="match-section">
                <div className="section-heading">
                  <div><span className="eyebrow">{section === "home" ? "THE SCOREBOARD" : selectedSport?.toUpperCase() ?? "MATCH CENTRE"}</span><h2>{section === "home" ? "Matches & results" : pageLabel}</h2></div>
                  <div className="update-stamp">{lastUpdated ? `Updated ${new Date(lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Ready when you are"}<span className={feedStatus === "provider" ? "connected-dot" : ""} /></div>
                </div>
                <div className="match-toolbar">
                  <StatusTabs selected={selectedStatus} onChange={setSelectedStatus} />
                  <div className="filter-controls">
                    {section === "home" && <label className="filter-select"><span className="sr-only">Filter by sport</span><SlidersHorizontal size={14} /><select value={sportFilter} onChange={(event) => setSportFilter(event.target.value as "all" | Sport)}><option value="all">All sports</option><option value="cricket">Cricket</option><option value="football">Football</option></select><ChevronDown size={13} /></label>}
                    {competitions.length > 1 && <label className="filter-select"><span className="sr-only">Filter by competition</span><select value={competitionFilter} onChange={(event) => setCompetitionFilter(event.target.value)}><option value="all">All competitions</option>{competitions.map((name) => <option key={name}>{name}</option>)}</select><ChevronDown size={13} /></label>}
                  </div>
                </div>
                {feedStatus === "loading" ? (
                  <div className="match-grid">{[1, 2, 3, 4].map((item) => <div className="skeleton-card" key={item}><span /><span /><span /></div>)}</div>
                ) : sections.length ? (
                  <div className="match-grid">{sections.map((match) => (
                    <MatchCard key={match.id} match={match} favorite={isFavorite(match)} onFavorite={toggleFavorite} />
                  ))}</div>
                ) : (
                  <div className="empty-inline"><div className="empty-icon"><Menu size={20} /></div><strong>{section === "favorites" ? "No favorites yet" : section === "search" ? "No matches found" : "No matches in this view"}</strong><span>{section === "favorites" ? "Tap the star on any match to keep it close." : "Try another filter, or check back when fixtures are available."}</span></div>
                )}
                <div className="matches-footer"><span>{sections.length} {sections.length === 1 ? "match" : "matches"} shown</span><Link href={selectedSport === "football" || sportFilter === "football" ? "/football/live" : "/cricket/live"}>View live scores <ArrowRight size={14} /></Link></div>
              </section>

              {section === "home" && (
                <section className="bottom-grid">
                  <StandingsPreview />
                  <aside className="panel follow-panel">
                    <span className="eyebrow">QUICK ACCESS</span><h2>Follow every fixture.</h2>
                    <p>Save your favorite teams and get back to their games faster.</p>
                    <div className="follow-links"><Link href="/cricket/series"><Activity size={15} />Cricket series <ArrowRight size={14} /></Link><Link href="/football/leagues"><Trophy size={15} />Football leagues <ArrowRight size={14} /></Link><Link href="/settings"><Settings2 size={15} />Data settings <ArrowRight size={14} /></Link></div>
                  </aside>
                </section>
              )}
            </>
          )}
          <footer className="page-footer"><span>© {new Date().getFullYear()} Matchday Sports Desk</span><span>Scores provided by third-party data services.</span><Link href="/settings">Data & preferences</Link></footer>
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navPrimary.map(({ href, label, icon: Icon }) => <Link href={href} key={href} className={isActive(section, href) ? "active" : ""}><Icon size={19} /><span>{label}</span></Link>)}
      </nav>
    </div>
  );
}
