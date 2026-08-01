const profileForRound = round => round === 2 ? 'r2-hybrid-rescue'
    : round === 3 ? 'r3-hybrid-rescue'
        : round <= 6 ? 'r4-r6-triage'
            : round <= 9 ? 'r7-r9-events'
                : round <= 13 ? 'r10-r13-advanced'
                    : round <= 20 ? 'r14-r20-zoned'
                        : round <= 23 ? 'r21-r23-counterweight'
                            : 'r24-r25-capsule';
const profiles = Object.fromEntries(Array.from({ length: 25 }, (_, i) => [i + 1, {
    round: i + 1,
    intended: profileForRound(i + 1),
    interventionBound: i + 1 === 2 ? 6 : 30,
    assumptions: ['production engine', 'seeded environment']
}]));
module.exports = { profiles };
