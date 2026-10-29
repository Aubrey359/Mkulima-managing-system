# Bundled libraries

Served with the app (not from a CDN) so PDF export works offline.

| File | Library | Licence |
|------|---------|---------|
| `jspdf-4.2.1.umd.min.js` | [jsPDF](https://github.com/parallax/jsPDF) 4.2.1 | MIT |
| `jspdf-autotable-5.0.9.min.js` | [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable) 5.0.9 | MIT |

To update: `npm pack jspdf@<v> jspdf-autotable@<v>` and copy `dist/jspdf.umd.min.js` and
`dist/jspdf.plugin.autotable.min.js` here, then update the `<script>` tags in `index.html`.
