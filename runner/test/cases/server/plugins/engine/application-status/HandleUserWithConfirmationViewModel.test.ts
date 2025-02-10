import {
    handleUserWithConfirmationViewModel
} from "../../../../../../src/server/plugins/engine/application-status/HandleUserWithConfirmationViewModel";
import * as Lab from "@hapi/lab";
import * as Code from "@hapi/code";
import sinon from 'sinon';

const {expect} = Code;
const lab = Lab.script();
exports.lab = lab;
const {suite, test, beforeEach, afterEach} = lab;

suite('HandleUserWithConfirmationViewModel', () => {
    let request, h, sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        request = {
            services: sandbox.stub().returns({
                adapterCacheService: {
                    getConfirmationState: sandbox.stub()
                }
            }),
            logger: {
                info: sandbox.stub()
            },
            params: {id: '123'},
            query: {},
            yar: {id: 'session-id'}
        };

        h = {
            redirect: sandbox.stub().returns({takeover: sandbox.stub()}),
            view: sandbox.stub().returns({takeover: sandbox.stub()})
        };
    });

    afterEach(() => {
        sandbox.restore();
    });

    test('should return null if confirmationViewModel is not found', async () => {
        request.services().adapterCacheService.getConfirmationState.resolves(null);
        const result = await handleUserWithConfirmationViewModel(request, h);
        expect(result).to.be.null();
    });

    test('should redirect if confirmationViewModel contains redirectUrl', async () => {
        request.services().adapterCacheService.getConfirmationState.resolves({redirectUrl: '/redirect-path'});
        await handleUserWithConfirmationViewModel(request, h);
        expect(h.redirect.calledWith('/redirect-path')).to.be.true();
        expect(request.logger.info.called).to.be.true();
    });

    test('should append form_session_identifier if present in query', async () => {
        request.query.form_session_identifier = 'abc123';
        request.services().adapterCacheService.getConfirmationState.resolves({redirectUrl: '/redirect-path'});
        await handleUserWithConfirmationViewModel(request, h);
        expect(h.redirect.calledWith('/redirect-path?form_session_identifier=abc123')).to.be.true();
    });

    test('should return a confirmation view if confirmationViewModel contains confirmation', async () => {
        const confirmationData = {message: 'Success'};
        request.services().adapterCacheService.getConfirmationState.resolves({confirmation: confirmationData});
        await handleUserWithConfirmationViewModel(request, h);
        expect(h.view.calledWith('confirmation', confirmationData)).to.be.true();
        expect(request.logger.info.called).to.be.true();
    });
});
