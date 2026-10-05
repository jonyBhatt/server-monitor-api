import { DatabaseTestModule } from '@/database/database-test.module';
import { DatabaseModule } from '@/database/database.module';
import { CreateLogAnalysisJobDto } from '@/log-analysis/log-analysis-jobs/dto/create-log-analysis-job.dto';
import { LogAnalysisJobType } from '@/log-analysis/log-analysis-jobs/entities/log-analysis-job.entity';
import { SshService } from '@/remote-servers/ssh/ssh.service';
import { createRemoteServer } from '@/testing/factories';
import { TicketStatus } from '@/ticketing';
import { TicketingProviderFactory } from '@/ticketing/ticketing-providers/ticketing-provider.factory';
import type { ITicketingProvider } from '@/ticketing/ticketing-providers/ticketing-provider.interface';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { resetDatabase } from './test-utils';

describe('Ticket Resolution (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let moduleFixture: TestingModule;
  const ticketProviderFactory = mock<TicketingProviderFactory>();
  const ticketProvider = mock<ITicketingProvider>();
  ticketProviderFactory.create.mockReturnValue(ticketProvider as any);
  const sshService = mock<SshService>();

  beforeEach(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(DatabaseModule)
      .useModule(DatabaseTestModule)
      .overrideProvider(TicketingProviderFactory)
      .useValue(ticketProviderFactory)
      .overrideProvider(SshService)
      .useValue(sshService)
      .compile();

    app = moduleFixture.createNestApplication();
    dataSource = moduleFixture.get<DataSource>(getDataSourceToken());
    await app.init();

    ticketProvider.createTicket.mockImplementation((props) => {
      return Promise.resolve({
        id: 'test-ticket-id',
        title: props.title,
        description: props.description,
        severity: props.severity,
        status: TicketStatus.OPEN,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
  });

  afterEach(async () => {
    await resetDatabase(dataSource);
    await app.close();
  });

  describe('ticket creation', () => {
    it('Should check the resolution', async () => {
      // Create a remote server

      const server = await createRemoteServer(dataSource, {
        config: {
          host: 'test-server.com',
          username: 'test-user',
          privateKey: 'test-private-key',
        },
        isConnectionConfigured: true,
      });

      // create a job
      const createLogAnalysisJobDto: CreateLogAnalysisJobDto = {
        name: 'test-log-analysis-job',
        type: LogAnalysisJobType.RECURRING,
        description: 'test-log-analysis-job-description',
        remoteServerId: server.id,
        ticketingSystemConfig: {
          type: 'ServiceNowTicketingProvider',
        },
      };

      const logAnalysisJobResponse = await request(app.getHttpServer())
        .post('/log-analysis-jobs')
        .send(createLogAnalysisJobDto)
        .expect(201);

      // send error logs to the job
      const errorLogs = [
        {
          message: 'Database connection failed',
          level: 'critical',
        },
      ];

      await request(app.getHttpServer())
        .post(`/log-analysis/ingest/${logAnalysisJobResponse.body.id}`)
        .send(errorLogs)
        .expect(200);

      await new Promise((resolve) => setTimeout(resolve, 10000));
    });
  });
}, 15000);
