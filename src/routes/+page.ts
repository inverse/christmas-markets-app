import type { PageLoad } from './$types';
import markets from '../../data/markets.json';

export const load: PageLoad = () => {
	return {
		markets
	};
};
