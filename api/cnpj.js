import {createHandler} from '../lib/cnpj-biz.mjs';
import {lookupBrasilApi} from '../lib/cnpj-brasilapi.mjs';
export default createHandler({lookup:lookupBrasilApi});
