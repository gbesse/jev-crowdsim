# jev-crowdsim

**Test a message across an explicit trait grid and see which declared combinations react differently.**

[![Tests](https://github.com/gbesse/jev-crowdsim/actions/workflows/test.yml/badge.svg)](https://github.com/gbesse/jev-crowdsim/actions/workflows/test.yml) [MIT](LICENSE) · Node.js 22+ · Zero runtime dependencies · Public alpha

Respondents are visible combinations of your levels—not model-written personas. Jev returns finite reactions; code computes main effects and Wilson intervals instead of hiding disagreement in one average.

## Try it in 30 seconds

```sh
git clone https://github.com/gbesse/jev-crowdsim.git && cd jev-crowdsim
npm run demo
node bin/jev-crowdsim.mjs run designs/starter.json --message examples/message.txt --fake
```

Fixture probabilities are synthetic, not measured people or Jev performance.

## Call real Jev

```sh
export TYPESAFE_API_KEY=... # paid requests go to https://api.typesafe.ai/v1/systemone
node bin/jev-crowdsim.mjs estimate design.json --message copy.txt --budget 200
node bin/jev-crowdsim.mjs compare a.txt b.txt --design design.json --budget 200
```

Reports include main effects and every respondent. Use the factorial, sampling, statistics, simulation and comparison functions as a library. See [experimental design](docs/designs.md).

## How it decides

Each respondent is one explicit trait dictionary. Its request asks `would_engage`, `trust`, `would_convert`, and one `objection` choice from the design's finite list. Up to 64 combinations run as a full factorial; larger spaces use a seeded balanced sample. `compare` freezes one grid across both messages. Means and 95% Wilson intervals are computed in code.

## Boundaries

This is directional triage over a simplified declared model, explicitly not user research, survey data, causal inference, or a claim about a real population. A winning message was tested only against your axes. Jev can be affected by injected text and literal wording. Calibrate decisions with real users.

## Validation

`npm run check`, `npm run typecheck`, `npm test`, and `npm run demo` run in CI on Node 22 and 24. Live smoke is opt-in and capped at two paid calls.

## Related projects

[Autonomy Meter](https://github.com/gbesse/autonomy-meter) · [Question Forge](https://github.com/gbesse/question-forge) · [jev-codebook](https://github.com/gbesse/jev-codebook)

Independent project; not affiliated with TypeSafe AI. [TypeSafe API](https://docs.typesafe.ai/api) · [known model limitations](https://docs.typesafe.ai/model-jaggedness/jev-1.13)
