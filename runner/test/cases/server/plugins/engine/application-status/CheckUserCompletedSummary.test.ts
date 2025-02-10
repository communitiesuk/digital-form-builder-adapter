import {
    checkUserCompletedSummary
} from "../../../../../../src/server/plugins/engine/application-status/CheckUserCompletedSummary";
import * as Lab from "@hapi/lab";
import * as Code from "@hapi/code";
import sinon from 'sinon';

const {expect} = Code;
const lab = Lab.script();
exports.lab = lab;
const {suite, test, beforeEach, afterEach} = lab;

suite('CheckUserCompletedSummary', () => {
    let request, h, sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        request = {
            services: sandbox.stub().returns({
                adapterCacheService: {
                    getState: sandbox.stub()
                }
            }),
            logger: {
                error: sandbox.stub()
            },
            params: {id: '123'},
            query: {},
            yar: {id: 'session-id'}
        };

        h = {
            redirect: sandbox.stub().returns({takeover: sandbox.stub()})
        };
    });

    afterEach(() => {
        sandbox.restore();
    });


    test('should return userCompletedSummary when true', async () => {
        request.services([]).adapterCacheService.getState.resolves({userCompletedSummary: true});
        const result = await checkUserCompletedSummary(request, h);
        expect(result).to.be.true();
        expect(h.redirect.called).to.be.false();
        expect(request.logger.error.called).to.be.false();
    });

    test('should redirect when userCompletedSummary is false', async () => {
        request.services([]).adapterCacheService.getState.resolves({userCompletedSummary: false});
        await checkUserCompletedSummary(request, h);
        expect(h.redirect.calledWith('/123/summary')).to.be.true();
        expect(request.logger.error.called).to.be.true();
    });

    test('should redirect when userCompletedSummary is undefined', async () => {
        request.services([]).adapterCacheService.getState.resolves({});
        await checkUserCompletedSummary(request, h);
        expect(h.redirect.calledWith('/123/summary')).to.be.true();
        expect(request.logger.error.called).to.be.true();
    });

    test('should include form_session_identifier in redirect URL if provided', async () => {
        request.query.form_session_identifier = 'abc123';
        request.services([]).adapterCacheService.getState.resolves({userCompletedSummary: false});
        await checkUserCompletedSummary(request, h);
        expect(h.redirect.calledWith('/123/summary?form_session_identifier=abc123')).to.be.true();
    });
});
