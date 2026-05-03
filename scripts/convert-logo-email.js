const fs = require('fs')
const path = require('path')
const { Resvg } = require('@resvg/resvg-js')

const svgPath = path.join(__dirname, '..', 'apps', 'web', 'public', 'brand', 'logo-primary.svg')
const outPath = path.join(__dirname, '..', 'apps', 'web', 'public', 'brand', 'logo-email.png')

const svg = fs.readFileSync(svgPath, 'utf8')

const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1120 },
  background: 'rgba(255,255,255,0)',
})
const png = resvg.render().asPng()
fs.writeFileSync(outPath, png)
console.log('Wrote', outPath, '(' + png.length + ' bytes)')
