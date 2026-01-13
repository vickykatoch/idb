import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

const input = 'src/index.ts';
const extensions = ['.ts'];

export default [
	// ESM + CJS (modern)
	{
		input,
		output: [
			{ file: 'dist/index.esm.js', format: 'esm', sourcemap: true },
			{ file: 'dist/index.cjs.js', format: 'cjs', sourcemap: true, exports: 'named' },
		],
		plugins: [
			resolve({ extensions }),
			commonjs(),
			typescript({ tsconfig: './tsconfig.json', tslib: false }),
		],
	},
	// ES5 legacy bundle (IIFE)
	{
		input,
		output: [
			{ file: 'dist/index.es5.iife.js', format: 'iife', name: 'IdbJsonLib', sourcemap: true },
		],
		plugins: [
			resolve({ extensions }),
			commonjs(),
			typescript({ tsconfig: './tsconfig.json', tslib: false }),
			babel({
				babelHelpers: 'bundled',
				extensions,
				presets: [['@babel/preset-env', { targets: '> 0.25%, not dead' }]],
			}),
		],
	},

	// Types (single d.ts entry)
	{
		input: 'dist/types/index.d.ts',
		output: [{ file: 'dist/index.d.ts', format: 'es' }],
		plugins: [dts()],
	},
];
