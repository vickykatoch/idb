import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const minimal = {
	name: pkg.name,
	version: pkg.version,
	description: pkg.description,
	main: './index.cjs.js',
	module: './index.esm.js',
	types: './index.d.ts',
	exports: pkg.exports,
	sideEffects: false,
};

fs.writeFileSync('dist/package.json', JSON.stringify(minimal, null, 2));
