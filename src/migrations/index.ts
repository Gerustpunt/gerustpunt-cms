import * as migration_20250929_111647 from './20250929_111647';
import * as migration_20260529_210439 from './20260529_210439';
import * as migration_20260530_091622 from './20260530_091622';

export const migrations = [
  {
    up: migration_20250929_111647.up,
    down: migration_20250929_111647.down,
    name: '20250929_111647',
  },
  {
    up: migration_20260529_210439.up,
    down: migration_20260529_210439.down,
    name: '20260529_210439',
  },
  {
    up: migration_20260530_091622.up,
    down: migration_20260530_091622.down,
    name: '20260530_091622'
  },
];
