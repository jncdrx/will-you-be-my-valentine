import { expect, it, vi } from 'vitest';

const mocks=vi.hoisted(()=>({
  session:{user:{id:'alice'},access_token:'alice-token'},
  getSession:vi.fn(),from:vi.fn(),rpc:vi.fn(),onAuthStateChange:vi.fn(),
}));
vi.mock('../src/lib/supabase',()=>({isSupabaseConfigured:()=>true,supabase:{
  auth:{getSession:mocks.getSession,onAuthStateChange:mocks.onAuthStateChange},from:mocks.from,rpc:mocks.rpc,
}}));

it('the bridge rejects other origins/accounts and pins the request token to the validated account',async()=>{
  const original=window.parent,parent={postMessage:vi.fn()};
  Object.defineProperty(window,'parent',{configurable:true,value:parent});
  const chain={select:vi.fn(),eq:vi.fn(),setHeader:vi.fn(),abortSignal:vi.fn(),maybeSingle:vi.fn()};
  chain.select.mockReturnValue(chain);chain.eq.mockReturnValue(chain);chain.setHeader.mockReturnValue(chain);
  chain.abortSignal.mockReturnValue(chain);chain.maybeSingle.mockResolvedValue({data:{revision:1},error:null});
  mocks.from.mockReturnValue(chain);mocks.getSession.mockResolvedValue({data:{session:mocks.session}});
  try {
    await import('../src/folio/bridge');
    const send=(owner:string,origin=location.origin)=>window.dispatchEvent(new MessageEvent('message',{
      source:parent as unknown as Window,origin,data:{channel:'folio-sync-v1',id:'request',op:'load',owner,key:'folio'},
    }));
    send('alice','https://attacker.invalid');await Promise.resolve();expect(mocks.from).not.toHaveBeenCalled();
    send('bob');await vi.waitFor(()=>expect(parent.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({id:'request',error:expect.any(String)}),location.origin));
    expect(mocks.from).not.toHaveBeenCalled();
    send('alice');await vi.waitFor(()=>expect(chain.maybeSingle).toHaveBeenCalled());
    expect(chain.eq).toHaveBeenCalledWith('user_id','alice');
    expect(chain.setHeader).toHaveBeenCalledWith('Authorization','Bearer alice-token');
    expect(chain.abortSignal).toHaveBeenCalledWith(expect.any(AbortSignal));
  } finally {Object.defineProperty(window,'parent',{configurable:true,value:original});}
});
