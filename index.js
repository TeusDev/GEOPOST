async function seekTeams(url = 'https://estagio.geopostenergy.com/WorldCup/GetAllTeams') {
	const response = await fetch(url, {
		method: 'GET',
		headers: {
			'git-user': 'TeusDev',
			'Content-Type': 'application/json',
		},
	});

	const data = await response.json();
	return data.Result;
}

function bracketGen(result) {
	// https://dev.to/asayerio_techblog/forever-functional-shuffling-an-array-not-as-trivial-as-it-sounds-2a3b
	const randomInt = (k) => Math.floor((k + 1) * Math.random());
	const fisherYatesShuffle = (arr) => {
		for (let i = arr.length - 1; i > 0; i--) {
			const j = randomInt(i);
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
		return arr;
	};
	// ------------------------------
	teams = fisherYatesShuffle(result);
	let genBrackets = [];
	for (let group = 0; group < 8; group++) {
		genBrackets[group] = teams.splice(0, 4);
	}
	return genBrackets;
}

function init(shuffledTeams) {
	players = document.querySelectorAll('.stand .group .player');
	for (let group = 0, rowSelector = 0; group < 8; group++, rowSelector += 4) {
		for (let team = 0; team < 4; team++) {
			players[team + rowSelector].children[0].innerHTML = shuffledTeams[group][team].Name;
			players[team + rowSelector].children[1].src =
				'https://countryflagsapi.com/png/' +
				shuffledTeams[group][team].Name.normalize('NFD')
					.replace(/[\u0300-\u036f]/g, '')
					.slice(0, 3);
		}
	}
}

function between(min = 0, max = 7) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function tieBreaker(t1, t2) {
	return Math.random() < 0.5 ? t1 : t2;
}

function groupPhase(clashRoster) {
	console.log('==============================');
	players = document.querySelectorAll('.stand .group .player');
	matches = document.querySelectorAll('.stand .games .match');
	// GROUP PHASE
	for (let group = 0, player = 0, match = 0; group < 8; group++) {
		clashRoster[group][4] = [];
		for (let t1 = 0, game = 0; t1 < clashRoster[group].length - 1; t1++) {
			for (let t2 = t1 + 1; t2 < clashRoster[group].length - 1; t2++, game++, match++) {
				// ------------------------------
				if (t1 == 0) {
					if (t2 == t1 + 1) {
						clashRoster[group][t1].played = 0;
						clashRoster[group][t1].pts = 0;
						clashRoster[group][t1].totalS = 0;
					}
					clashRoster[group][t2].played = 0;
					clashRoster[group][t2].pts = 0;
					clashRoster[group][t2].totalS = 0;
				}
				// ------------------------------
				clashRoster[group][4][game] = {
					t1: { Name: clashRoster[group][t1].Name, Score: between() },
					t2: { Name: clashRoster[group][t2].Name, Score: between() },
				};
				// ---------------
				console.log(
					'[ group:',
					group + 1,
					'] ==',
					clashRoster[group][t1].Name,
					'||',
					clashRoster[group][4][game].t1.Score,
					'> vs <',
					clashRoster[group][4][game].t2.Score,
					'||',
					clashRoster[group][t2].Name,
					'==',
					clashRoster[group][4][game]
				);
				// ------------------------------
				if (clashRoster[group][4][game].t1.Score > clashRoster[group][4][game].t2.Score) {
					clashRoster[group][t1].pts += 3;
					matches[match].children[0].classList.add('w');
					// ---------------
					console.log(clashRoster[group][t1].Name, 'ganhou 3 pontos e totalizou', clashRoster[group][t1].pts + '!');
				} else if (clashRoster[group][4][game].t1.Score == clashRoster[group][4][game].t2.Score) {
					clashRoster[group][t1].pts++;
					clashRoster[group][t2].pts++;
					matches[match].children[0].classList.add('even');
					matches[match].children[2].classList.add('even');
					// ---------------
					console.log('Empatou!', clashRoster[group][t1].Name, 'e', clashRoster[group][t2].Name, 'recebem 1 ponto!');
				} else {
					clashRoster[group][t2].pts += 3;
					matches[match].children[2].classList.add('w');
					// ---------------
					console.log(clashRoster[group][t2].Name, 'ganhou 3 pontos e totalizou', clashRoster[group][t2].pts + '!');
				}
				// ------------------------------
				clashRoster[group][t1].totalS += clashRoster[group][4][game].t1.Score;
				clashRoster[group][t2].totalS += clashRoster[group][4][game].t2.Score;
				clashRoster[group][t1].played += 1;
				clashRoster[group][t2].played += 1;
				// ------------------------------
				matches[match].children[0].innerHTML = clashRoster[group][t1].Name;
				matches[match].children[2].innerHTML = clashRoster[group][t2].Name;
				matches[match].children[4].innerHTML = clashRoster[group][4][game].t1.Score + ' X ' + clashRoster[group][4][game].t2.Score;
				matches[match].children[1].src =
					'https://countryflagsapi.com/png/' +
					clashRoster[group][t1].Name.normalize('NFD')
						.replace(/[\u0300-\u036f]/g, '')
						.slice(0, 3);
				matches[match].children[3].src =
					'https://countryflagsapi.com/png/' +
					clashRoster[group][t2].Name.normalize('NFD')
						.replace(/[\u0300-\u036f]/g, '')
						.slice(0, 3);
				// ------------------------------
			}
		}
		for (let team = 0; team < 4; team++, player++) {
			players[player].children[2].innerHTML = 'Pontos: ' + clashRoster[group][team].pts;
			players[player].children[3].innerHTML = 'T. de gols: ' + clashRoster[group][team].totalS;
		}
		// ------------------------------
		// SORT BASED ON THIS ORDER, DESCENDING BY PRIORITY LEVEL: points - totalScore - balancedRandomSelection
		sets = clashRoster[group].pop();
		clashRoster[group].sort((a, b) => (a.pts - b.pts ? b.pts - a.pts : a.totalS - b.totalS ? b.totalS - a.totalS : tieBreaker(1, -1)));
		clashRoster[group].push(sets);
		// ------------------------------
		players = document.querySelectorAll('.player');
		for (let team = 0, p1 = player - 4; team < 4; team++, p1++) {
			if (players[p1].children[0].innerHTML == clashRoster[group][0].Name) players[p1].children[0].classList.add('w');
		}
		console.log('==============================');
	}
	console.log('Clash result:', clashRoster);
	return clashRoster;
}

function r16(players) {
	players[8] = [];
	for (let group = 0; group < 8; group++) {
		players[8][group] = [];
		if (group % 2 === 0) {
			players[8][group][0] = { Token: players[group][0].Token, Name: players[group][0].Name, goals: 0, gPenalty: 0 };
			players[8][group][1] = { Token: players[group + 1][1].Token, Name: players[group + 1][1].Name, goals: 0, gPenalty: 0 };
		} else {
			players[8][group][0] = { Token: players[group][0].Token, Name: players[group][0].Name, goals: 0, gPenalty: 0 };
			players[8][group][1] = { Token: players[group - 1][1].Token, Name: players[group - 1][1].Name, goals: 0, gPenalty: 0 };
		}
	}
}

function penalty(a, b, max = 5) {
	a.gPenalty = between(0, max);
	b.gPenalty = between(0, max);
	console.log(max + ' max || [PENALTY]', a.Name, a.gPenalty, 'X', b.gPenalty, b.Name);
	let w = a.gPenalty == b.gPenalty ? penalty(a, b, 1) : a.gPenalty > b.gPenalty ? a : b;
	return w;
}

function md1(arena, run, pos) {
	let survivors = [],
		reset = 0,
		jump = 2;
	for (let i = 0; i < arena.length; i++) {
		let g1 = between(),
			g2 = between();
		(Math.floor(i / 2) % 2) % 2 == 0 ? (survivors[Math.ceil(i / 2)] = []) : null;

		if (arena[0].length == 1 && arena[1].length == 1) {
			arena[0][1] = arena[1].pop();
			arena.pop();
			arena[0][0].goals = g1;
			arena[0][1].goals = g2;
			console.log(arena[0][0].Name, arena[0][0].goals, 'vs', arena[0][1].goals, arena[0][1].Name);
			arena[0][0].goals == arena[0][1].goals ? penalty(arena[0][0], arena[0][1]) : ((arena[0][0].gPenalty = 0), (arena[0][1].gPenalty = 0));
			return arena;
		}
		arena[i][0].goals = g1;
		arena[i][1].goals = g2;

		console.log(arena[i][0].Name, arena[i][0].goals, 'vs', arena[i][1].goals, arena[i][1].Name);

		r[run].children[1].children[i].children[4].innerHTML = arena[i][0].goals + ' X ' + arena[i][1].goals;

		result = g1 == g2 ? penalty(arena[i][0], arena[i][1]) : g1 > g2 ? arena[i][0] : arena[i][1];

		(g1 == g2
			? result.gPenalty > result.gPenalty
				? r[run].children[1].children[i].children[0]
				: r[run].children[1].children[i].children[2]
			: result.goals > result.goals
			? r[run].children[1].children[i].children[0]
			: r[run].children[1].children[i].children[2]
		).classList.add('w');

		if (reset == 2) {
			reset = 0;
			jump += 2;
		}

		if (i - jump < 0) {
			console.log(i, '[if]Push to:', i, 'jump', jump);
			survivors[i].push(result);
		} else {
			console.log(i, '[else]Push to:', i - jump, 'jump', jump);
			survivors[i - jump].push(result);
			if (i > 3) {
				reset++;
			}
		}
	}
	return survivors;
}

document.addEventListener('DOMContentLoaded', async () => {
	const apiRequest = await seekTeams();
	let brackets = bracketGen(apiRequest);

	delete apiRequest;

	init(brackets);

	let last16 = groupPhase(brackets);

	delete brackets;

	r16(last16);

	let finalists = last16[8];

	delete last16;

	for (let i = finalists.length, pos = 0, run = 0; i != 0.5; i = i / 2, run++, pos = 0) {
		console.log('====================\n' + 'Confrontos:', i + '\n====================');
		console.log(finalists);
		r = document.querySelectorAll('.r');
		if (i != 1)
			for (let scrn = 0; scrn < finalists.length; scrn++) {
				for (let subPos = 0, opponent = subPos; subPos < 2; subPos++, pos++, opponent += 2) {
					r[run].children[0].children[pos].children[0].innerHTML = finalists[scrn][subPos].Name;
					r[run].children[0].children[pos].children[1].src =
						'https://countryflagsapi.com/png/' +
						finalists[scrn][subPos].Name.normalize('NFD')
							.replace(/[\u0300-\u036f]/g, '')
							.slice(0, 3);

					r[run].children[1].children[scrn].children[opponent].innerHTML = finalists[scrn][subPos].Name;
					r[run].children[1].children[scrn].children[opponent + 1].src =
						'https://countryflagsapi.com/png/' +
						finalists[scrn][subPos].Name.normalize('NFD')
							.replace(/[\u0300-\u036f]/g, '')
							.slice(0, 3);
					console.log(run, pos, '||', scrn, subPos);
				}
			}
		else {
			const p1Final = finalists[0][0].Name;
			const p2Final = finalists[1][0].Name;
			r[run].children[0].children[0].children[0].innerHTML = p1Final;
			r[run].children[1].children[0].children[0].innerHTML = p1Final;
			r[run].children[1].children[0].children[1].src =
				'https://countryflagsapi.com/png/' +
				p1Final
					.normalize('NFD')
					.replace(/[\u0300-\u036f]/g, '')
					.slice(0, 3);
			r[run].children[0].children[1].children[0].innerHTML = p2Final;
			r[run].children[1].children[0].children[2].innerHTML = p2Final;
			r[run].children[1].children[0].children[3].src =
				'https://countryflagsapi.com/png/' +
				p2Final
					.normalize('NFD')
					.replace(/[\u0300-\u036f]/g, '')
					.slice(0, 3);
			r[run].children[0].children[0].children[1].src =
				'https://countryflagsapi.com/png/' +
				p1Final
					.normalize('NFD')
					.replace(/[\u0300-\u036f]/g, '')
					.slice(0, 3);
			r[run].children[0].children[1].children[1].src =
				'https://countryflagsapi.com/png/' +
				p2Final
					.normalize('NFD')
					.replace(/[\u0300-\u036f]/g, '')
					.slice(0, 3);
		}
		finalists = md1(finalists, run, pos);
		if (i == 1) {
			r[run].children[1].children[0].children[4].innerHTML = finalists[0][0].goals + ' X ' + finalists[0][1].goals;
			(finalists[0][0].goals == finalists[0][1].goals
				? finalists[0][0].gPenalty > finalists[0][1].gPenalty
					? r[run].children[1].children[0].children[0]
					: r[run].children[1].children[0].children[2]
				: finalists[0][0].goals > finalists[0][1].goals
				? r[run].children[1].children[0].children[0]
				: r[run].children[1].children[0].children[2]
			).classList.add('w');
		}
	}

	console.log('Source:', finalists);
	console.log({
		equipeA: finalists[0][0].Token,
		equipeB: finalists[0][1].Token,
		golsEquipeA: finalists[0][0].goals,
		golsEquipeB: finalists[0][1].goals,
		golsPenaltyTimeA: finalists[0][0].gPenalty,
		golsPenaltyTimeB: finalists[0][1].gPenalty,
	});

	nav = document.querySelectorAll('nav');

	groupControls = Array.from(nav[0].children[0].children);
	stageControls = Array.from(nav[0].children[1].children);

	groupControls.map((x) =>
		x.addEventListener('click', () => {
			document.querySelector('.gActive').classList.remove('gActive');
			x.classList.add('gActive');
			document.querySelector('.enable').classList.remove('enable');
			document.querySelectorAll('.stand')[groupControls.indexOf(x)].classList.add('enable');
		})
	);
	groupControls.map((x) =>
		x.addEventListener('mouseover', () => {
			x.classList.add('hover');
		})
	);
	groupControls.map((x) =>
		x.addEventListener('mouseout', () => {
			x.classList.remove('hover');
		})
	);

	stageControls.map((x) =>
		x.addEventListener('click', () => {
			document.querySelector('.active').classList.remove('active');
			x.classList.add('active');
			document.querySelector('.gActive').classList.remove('gActive');
			groupControls[0].classList.add('gActive');
			document.querySelector('.enable').classList.remove('enable');
			const auxbar = document.querySelector('.auxbar');
			const idxof = stageControls.indexOf(x);
			idxof == 0 ? auxbar.classList.add('visible') : auxbar.classList.remove('visible');
			document.querySelectorAll('.stand')[idxof + (idxof == 0 ? 0 : 7)].classList.add('enable');
		})
	);
});
