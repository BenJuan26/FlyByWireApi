import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from './session.entity';

@Injectable()
export class AuthService {
    // private readonly logger = new Logger(AuthService.name);

    constructor(@InjectRepository(Session)
        private readonly sessionRepo: Repository<Session>) {
    }

    getSession(id: string): Promise<Session> {
        return this.sessionRepo.findOne(id);
    }

    async newSession() : Promise<Session> {
        return this.sessionRepo.save(new Session());
    }

    async saveSession(session: Session): Promise<Session> {
        return this.sessionRepo.save(session);
    }

    filterSession(session: Session): Session {
        for (const [k, v] of Object.entries(session)) {
            if (!v) {
                delete session[k];
            }
        }

        delete session.verifier;

        return session;
    }
}
