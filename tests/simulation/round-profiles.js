const profiles = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [i + 1, {
    round: i + 1, intended: i + 1 === 2 ? 'r2-hybrid-rescue' : i + 1 === 7 ? 'r7-checkout' : i + 1 === 8 ? 'r8-vip' : i + 1 === 9 ? 'r9-rooftop-stink' : i + 1 === 10 ? 'r10-custom' : i + 1 === 11 ? 'r11-weight' : i + 1 === 13 ? 'r13-gravity' : i + 1 >= 14 ? 'zoned-scale' : 'strong',
    interventionBound: i + 1 === 2 ? 6 : 30, assumptions: ['production engine', 'seeded environment']
}]));
module.exports = { profiles };
