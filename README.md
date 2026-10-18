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

## Shareable demo report

Run `npm run demo:report` to capture this repository’s bundled example as one JSON object with the project purpose, version and complete demo output. The command fails if the demo fails, so the report is useful when sharing a reproducible first look or reporting unexpected behavior. The bundled demo’s data and safety boundaries still apply.

## Validation

`npm run check`, `npm run typecheck`, `npm test`, and `npm run demo` run in CI on Node 22 and 24. Live smoke is opt-in and capped at two paid calls.

## Related projects

[Autonomy Meter](https://github.com/gbesse/autonomy-meter) · [Question Forge](https://github.com/gbesse/question-forge) · [jev-codebook](https://github.com/gbesse/jev-codebook)

Independent project; not affiliated with TypeSafe AI. [TypeSafe API](https://docs.typesafe.ai/api) · [known model limitations](https://docs.typesafe.ai/model-jaggedness/jev-1.13)

## Bounded grid sampling / Échantillonnage borné / Muestreo limitado

EN: `chooseRespondents` samples mixed-radix combination indices without constructing the entire Cartesian product. Budget is honored even below `maxFull`; `coverage` lists observed/missing levels. Direct `factorial` expansion is limited to 100,000 rows. Unsampled main effects and Wilson intervals are `null`; HTML reports show a dash and accept `{lang: 'fr'|'en'|'es'}`. Report writes create new private files only. Sampling is a reproducible heuristic over declared synthetic traits, not a representative human population, observed conversion rate or validated confidence interval for real customers.

FR : `chooseRespondents` échantillonne des indices à base mixte sans construire tout le produit cartésien. Le budget s’applique même sous `maxFull` ; `coverage` liste les niveaux examinés/absents. L’expansion directe `factorial` est limitée à 100 000 lignes. Effets et intervalles Wilson sans observations valent `null` ; le HTML affiche un tiret et accepte `{lang: 'fr'|'en'|'es'}`. Les rapports créent seulement de nouveaux fichiers privés. C’est une heuristique reproductible sur traits synthétiques déclarés, pas une population humaine représentative, un taux de conversion observé ou un intervalle validé sur clients réels.

ES: `chooseRespondents` muestrea índices de base mixta sin construir todo el producto cartesiano. Respeta presupuesto incluso bajo `maxFull`; `coverage` lista niveles observados/ausentes. Expansión directa `factorial` limitada a 100 000 filas. Efectos e intervalos Wilson sin observaciones son `null`; HTML muestra guion y acepta `{lang: 'fr'|'en'|'es'}`. Informes solo crean archivos privados nuevos. Es heurística reproducible de rasgos sintéticos declarados, no población humana representativa, conversión observada ni intervalos validados de clientes reales.


FR : Une erreur ou annulation empêche de démarrer d’autres répondants ; aucun rapport partiel n’est présenté comme complet. `simulate({..., signal})` transmet l’annulation au fournisseur et refuse les réponses tardives. Un fournisseur ignorant le signal peut continuer son travail déjà engagé. Traits, questions et réponses sont détachés pour éviter des mutations par callbacks. `compare` conserve sa grille appariée et valide les deux messages avant les appels. Budget par message : une comparaison peut effectuer deux fois ce nombre de requêtes. Messages textuels non vides, au plus 50 000 caractères. Les clés utilisateur ressemblant à des prototypes restent des données dans les effets exportés.

EN: A failure or cancellation stops dispatching further respondents; no partial report is presented as complete. `simulate({..., signal})` forwards cancellation to the provider and rejects late answers. A provider ignoring the signal may continue already-started work. Traits, questions and answers are detached to avoid callback mutations. `compare` preserves its paired grid and validates both messages before calls. Budget is per message: a comparison can make twice that number of requests. Nonempty text messages, at most 50,000 characters. Prototype-like user keys remain data in exported effects.

ES: Un fallo o cancelación impide iniciar más participantes; no se presenta un informe parcial como completo. `simulate({..., signal})` transmite la cancelación al proveedor y rechaza respuestas tardías. Un proveedor que ignore la señal puede continuar trabajo ya iniciado. Rasgos, preguntas y respuestas se separan para evitar mutaciones por callbacks. `compare` conserva su cuadrícula emparejada y valida ambos mensajes antes de llamar. Presupuesto por mensaje: una comparación puede realizar el doble de solicitudes. Mensajes de texto no vacíos, máximo 50.000 caracteres. Las claves de usuario de tipo prototipo siguen siendo datos en los efectos exportados.
