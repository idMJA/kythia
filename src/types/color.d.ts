export type ColorInput = string | number | { r: number; g: number; b: number };
export type ColorOutput = string | number | { r: number; g: number; b: number };

export interface ConvertColorOptions {
	from: 'hex' | 'rgb' | 'decimal' | 'discord';
	to: 'hex' | 'rgb' | 'decimal';
}
