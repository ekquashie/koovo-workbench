import { ConfigService } from '@nestjs/config';
import { ImportOrigin } from './enums/import-origin.enum';
import { ImportsService } from './imports.service';
import { SeedService } from './seed.service';

describe('SeedService', () => {
  const setup = (seedOnStartup: boolean) => {
    const imports = { import: jest.fn().mockResolvedValue({}) };
    const config = { get: jest.fn().mockReturnValue(seedOnStartup) };
    const service = new SeedService(
      config as unknown as ConfigService,
      imports as unknown as ImportsService,
    );
    return { service, imports };
  };

  it('imports the seed file as a SEED batch on startup when enabled', async () => {
    const { service, imports } = setup(true);
    await service.onApplicationBootstrap();
    expect(imports.import).toHaveBeenCalledTimes(1);
    const [records, origin] = imports.import.mock.calls[0];
    expect(records).toHaveLength(11);
    expect(origin).toBe(ImportOrigin.SEED);
  });

  it('does nothing on startup when disabled', async () => {
    const { service, imports } = setup(false);
    await service.onApplicationBootstrap();
    expect(imports.import).not.toHaveBeenCalled();
  });

  it('fails loudly if the seed file is missing', async () => {
    const { service } = setup(true);
    await expect(service.seed('/nope/seed.json')).rejects.toThrow();
  });
});
