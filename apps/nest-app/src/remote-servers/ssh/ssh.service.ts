import { Injectable } from '@nestjs/common';
import { NodeSSH } from 'node-ssh';

export interface SSHConnection {
  host: string;
  username: string;
  privateKey: string;
}

export interface SSHCommandResult {
  stdout: string;
  stderr: string;
  code: number | null;
}

@Injectable()
export class SshService {
  async executeCommand(
    connection: SSHConnection,
    command: string,
  ): Promise<SSHCommandResult> {
    const ssh = new NodeSSH();
    try {
      await ssh.connect({
        host: connection.host,
        username: connection.username,
        privateKey: connection.privateKey,
      });
      const result = await ssh.execCommand(command);
      return {
        stdout: result.stdout,
        stderr: result.stderr,
        code: result.code ?? null,
      };
    } finally {
      ssh.dispose();
    }
  }
}
