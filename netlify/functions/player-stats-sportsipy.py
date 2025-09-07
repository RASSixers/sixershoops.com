import json
from sportsipy.nba.roster import Roster


def season_str_to_year(season: str) -> int:
    """Convert '2023-24' to 2024 (Sports Reference uses the end year)."""
    if not season:
        # Guess current season end year using UTC month (Oct start)
        import datetime
        now = datetime.datetime.utcnow()
        year = now.year - (1 if now.month <= 8 else 0)
        return year + 1
    try:
        start = int(season.split('-')[0])
        return start + 1
    except Exception:
        # Fallback: try parse int if passed like '2024'
        try:
            return int(season)
        except Exception:
            import datetime
            now = datetime.datetime.utcnow()
            year = now.year - (1 if now.month <= 8 else 0)
            return year + 1


def get_first_attr(obj, names, default=None):
    for n in names:
        if hasattr(obj, n):
            v = getattr(obj, n)
            if v is not None:
                return v
    return default


def safe_float(v, default=0.0):
    try:
        if v is None:
            return float(default)
        return float(v)
    except Exception:
        return float(default)


def to_player_dict(p):
    # Try multiple attribute names for compatibility across sportsipy versions
    name = get_first_attr(p, ['name', 'player_name'])
    if not name:
        first = get_first_attr(p, ['first_name'], '') or ''
        last = get_first_attr(p, ['last_name'], '') or ''
        name = (first + ' ' + last).strip() or 'Unknown'

    gp = get_first_attr(p, ['games_played', 'games'])

    # Minutes per game
    mpg = get_first_attr(p, [
        'minutes_played_per_game', 'minutes_per_game', 'mp_per_game', 'mpg', 'minutes_per_game_played'
    ])
    if mpg is None:
        minutes_total = get_first_attr(p, ['minutes_played'])
        try:
            mpg = (float(minutes_total) / float(gp)) if (minutes_total and gp) else 0
        except Exception:
            mpg = 0

    pts = get_first_attr(p, ['points_per_game', 'ppg'])
    reb = get_first_attr(p, ['total_rebounds_per_game', 'rebounds_per_game', 'rpg'])
    ast = get_first_attr(p, ['assists_per_game', 'apg'])
    stl = get_first_attr(p, ['steals_per_game', 'spg'])
    blk = get_first_attr(p, ['blocks_per_game', 'bpg'])
    tov = get_first_attr(p, ['turnovers_per_game'])

    fg_pct = get_first_attr(p, ['field_goal_percentage', 'fg_pct'])
    tp_pct = get_first_attr(p, ['three_point_percentage', 'three_point_field_goal_percentage', 'fg3_pct'])
    ft_pct = get_first_attr(p, ['free_throw_percentage', 'ft_pct'])

    fga = get_first_attr(p, ['field_goal_attempts_per_game'])
    fgm = get_first_attr(p, ['field_goals_per_game'])
    fta = get_first_attr(p, ['free_throw_attempts_per_game'])
    ftm = get_first_attr(p, ['free_throws_per_game'])

    # Normalize to floats
    gp = int(gp or 0)
    min_pg = safe_float(mpg, 0.0)
    pts_pg = safe_float(pts, 0.0)
    reb_pg = safe_float(reb, 0.0)
    ast_pg = safe_float(ast, 0.0)
    stl_pg = safe_float(stl, 0.0)
    blk_pg = safe_float(blk, 0.0)
    tov_pg = safe_float(tov, 0.0)

    fg_pct = safe_float(fg_pct, 0.0)
    tp_pct = safe_float(tp_pct, 0.0)
    ft_pct = safe_float(ft_pct, 0.0)

    fga_pg = safe_float(fga, 0.0)
    fgm_pg = safe_float(fgm, 0.0)
    fta_pg = safe_float(fta, 0.0)
    ftm_pg = safe_float(ftm, 0.0)

    # Efficiency proxy similar to frontend usage
    eff = pts_pg + reb_pg + ast_pg + stl_pg + blk_pg - tov_pg - (fga_pg - fgm_pg) - (fta_pg - ftm_pg)

    return {
        'playerId': None,
        'name': name,
        'gp': gp,
        'min': min_pg,
        'pts': pts_pg,
        'reb': reb_pg,
        'ast': ast_pg,
        'stl': stl_pg,
        'blk': blk_pg,
        'tov': tov_pg,
        'plusMinus': 0.0,
        'fgPct': fg_pct,
        'threePct': tp_pct,
        'ftPct': ft_pct,
        'eff': eff,
    }


def handler(event, context):
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return { 'statusCode': 200, 'headers': headers, 'body': '' }

    try:
        params = event.get('queryStringParameters') or {}
        season = (params.get('season') or '').strip()
        year = season_str_to_year(season)

        roster = Roster('PHI', year=year)
        players_raw = getattr(roster, 'players', []) or []
        players = [to_player_dict(p) for p in players_raw]

        body = json.dumps({
            'success': True,
            'season': season or f"{year-1}-{str(year)[2:]}",
            'players': players,
            'source': 'sportsipy'
        })

        return { 'statusCode': 200, 'headers': headers, 'body': body }
    except Exception as e:
        err = json.dumps({ 'success': False, 'error': str(e) })
        return { 'statusCode': 200, 'headers': headers, 'body': err }
