import { Controller, Get, HttpException, HttpService, HttpStatus, Param, Post, Query, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generators } from 'openid-client';
import { map, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Status } from './session.entity';

type TokenResponse = { /* eslint-disable camelcase */
    token_type: string,
    expires_in: number,
    access_token: string,
    refresh_token: string
}

@Controller()
export class AuthController {
    constructor(private readonly http: HttpService,
        private readonly configService: ConfigService,
        private readonly authService: AuthService) {
        this.clientId = configService.get('chartfox.clientId');
        this.redirectUri = configService.get('chartfox.redirectUri');
    }

    clientId: ''

    redirectUri: ''

    @Get('/chartfox/auth')
    async chartfoxAuth(@Query('session_id') sessionId, @Res() res) {
        if (!sessionId) {
            throw new HttpException('session_id missing', HttpStatus.BAD_REQUEST);
        }

        const session = await this.authService.getSession(sessionId);
        if (!session) {
            throw new HttpException('session does not exist', HttpStatus.NOT_FOUND);
        }

        session.verifier = generators.codeVerifier(32);
        session.status = Status.Processing;
        this.authService.saveSession(session);
        const codeChallenge = generators.codeChallenge(session.verifier);
        return res.redirect('https://api.chartfox.org/oauth/authorize'
            + '?response_type=code'
            + '&scope=charts:index%20charts:view'
            + `&client_id=${this.clientId}`
            + `&state=${session.id}`
            + `&code_challenge=${codeChallenge}`
            + '&code_challenge_method=S256'
            + `&redirect_uri=${this.redirectUri}`);
    }

    @Get('/chartfox/callback')
    async chartfoxCallback(@Query('code') code, @Query('state') sessionId) {
        const session = await this.authService.getSession(sessionId);

        let resp: TokenResponse;
        try {
            resp = await this.http.post<TokenResponse>('https://api.chartfox.org/oauth/token', {
                grant_type: 'authorization_code',
                redirect_uri: this.redirectUri,
                code_verifier: session.verifier,
                code,
                client_id: this.clientId,
            })
                .pipe(
                    tap((response) => console.log(`Response status ${response.status} for chartfox session`)),
                    map((response) => response.data),
                )
                .toPromise();
        } catch (err) {
            console.log(err);
            session.status = Status.Failed;
            this.authService.saveSession(session);
            throw err;
            // TODO: is this the right way to error here?
        }

        console.log(resp);
        session.accessToken = resp.access_token;
        session.refreshToken = resp.refresh_token;
        // relative to current time is close enough. could parse the JWT to extract exp but why bother
        session.tokenExpiryDate = new Date(new Date().getTime() + resp.expires_in * 1000);
        session.status = Status.Completed;
        this.authService.saveSession(session);
        return resp;
    }

    @Post('/chartfox/session')
    async newChartfoxSession() {
        return this.authService.newSession();
    }

    @Get('/chartfox/session/:id')
    async getSession(@Param() params: { id: string }) {
        return this.authService.getSession(params.id);
    }
}
