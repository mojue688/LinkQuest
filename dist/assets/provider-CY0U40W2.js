var d=Object.defineProperty;var w=(e,t,s)=>t in e?d(e,t,{enumerable:!0,configurable:!0,writable:!0,value:s}):e[t]=s;var u=(e,t,s)=>w(e,typeof t!="symbol"?t+"":t,s);class o extends Error{constructor(s,n,r){super(n);u(this,"kind");u(this,"status");this.name="AIError",this.kind=s,this.status=r}}function f(e){let t=e.trim().replace(/\/+$/,"");return/\/chat\/completions$/.test(t)?t:/\/v1$/.test(t)?`${t}/chat/completions`:/\/v1/.test(t)?`${t}/chat/completions`:`${t}/v1/chat/completions`}function y(e,t,s,n){return new Promise((r,a)=>{const i=new AbortController,c=setTimeout(()=>{i.abort(),a(new o("timeout",`请求超时（${s}ms）`))},s);if(n){if(n.aborted){clearTimeout(c),i.abort(),a(new o("timeout","请求已取消。"));return}n.addEventListener("abort",()=>{clearTimeout(c),i.abort(),a(new o("timeout","请求已取消。"))},{once:!0})}fetch(e,{...t,signal:i.signal}).then(m=>{clearTimeout(c),r(m)}).catch(m=>{clearTimeout(c),m.name==="AbortError"?n!=null&&n.aborted?a(new o("timeout","请求已取消。")):a(new o("timeout",`请求超时（${s}ms）`)):a(new o("network",`网络请求失败：${m.message}`))})})}async function g(e){var t;if(e.status===401||e.status===403)throw new o("auth","鉴权失败：API Key 无效或无权限。",e.status);if(e.status===429)throw new o("rate_limit","请求过于频繁，已被限流，请稍后重试。",e.status);if(!e.ok){let s="";try{const n=await e.json();s=((t=n==null?void 0:n.error)==null?void 0:t.message)??(n==null?void 0:n.message)??""}catch{}throw new o("unknown",`服务返回错误 ${e.status}${s?"："+s:""}`,e.status)}try{return await e.json()}catch{throw new o("parse","响应不是合法的 JSON。",e.status)}}function l(e){var s,n;const t=(s=e.choices)==null?void 0:s[0];return((n=t==null?void 0:t.message)==null?void 0:n.content)??""}function p(e){let t=e.trim();const s=t.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);return s&&(t=s[1].trim()),t.startsWith("```")&&(t=t.replace(/^```(?:json)?\s*\n?/,"").trim()),t}class h{constructor(t){u(this,"config");u(this,"chatUrl");this.config=t,this.chatUrl=f(t.endpoint)}isAvailable(){return!!this.config.apiKey&&!!this.config.endpoint&&!!this.config.model}async chat(t){const s=this.config.timeout??3e4,n=this.config.maxRetries??2;let r;for(let a=0;a<=n;a++)try{const i=await y(this.chatUrl,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${this.config.apiKey}`},body:JSON.stringify(t)},s,t.signal);return await g(i)}catch(i){if(r=i,i instanceof o&&(i.kind==="auth"||i.kind==="parse"||i.kind==="invalid"))throw i;if(i instanceof o&&i.kind==="rate_limit"){await new Promise(c=>setTimeout(c,1e3*(a+1)));continue}await new Promise(c=>setTimeout(c,400*(a+1)))}throw r instanceof Error?r:new o("unknown","请求失败且重试耗尽。")}async generateScene(t){const s=[{role:"system",content:'你是互动叙事编剧。根据用户提示生成一个场景节点，返回 JSON：{"title":"场景标题","text":"场景正文","speaker":"说话人(可选)"}。text 应有氛围感和细节，80-200 字。'},{role:"user",content:t.prompt+(t.context?`
上下文：${t.context}`:"")}],n=await this.chat({model:this.config.model,messages:s,temperature:.8,response_format:{type:"json_object"}}),r=l(n);try{return JSON.parse(p(r))}catch{throw new o("parse","生成场景的返回无法解析为 JSON。")}}async generateBranch(t){const n=[{role:"system",content:`你是互动叙事编剧。为给定场景生成 ${t.count??3} 个可选行动分支，返回 JSON：{"choices":[{"label":"简短选项","description":"可选说明"}]}。label 控制在 12 字内。`},{role:"user",content:`场景：${t.sceneText}`}],r=await this.chat({model:this.config.model,messages:n,temperature:.85,response_format:{type:"json_object"}}),a=l(r);try{return JSON.parse(p(a))}catch{throw new o("parse","生成分支的返回无法解析为 JSON。")}}async generateStory(t){const s=t.endingCount??3,n=[{role:"system",content:k(s)},{role:"user",content:t.prompt}],r=await this.chat({model:this.config.model,messages:n,temperature:.85,max_tokens:4096,response_format:{type:"json_object"},signal:t.signal}),a=l(r);return{story:JSON.parse(p(a)),source:"ai",raw:a}}async review(t){const s=[{role:"system",content:'你是剧情评审专家。对给定剧情给出评分(0-10)和改进建议，返回 JSON：{"score":7,"suggestions":["建议1","建议2"]}。'},{role:"user",content:t.content}],n=await this.chat({model:this.config.model,messages:s,temperature:.6,response_format:{type:"json_object"}}),r=l(n);try{return JSON.parse(p(r))}catch{throw new o("parse","评审返回无法解析为 JSON。")}}}function k(e){return`你是一位资深互动叙事编剧，擅长设计悬疑、解谜、分支选择与多结局的互动故事。

根据用户的一句话描述，生成一个完整的互动故事，返回严格的 JSON，结构如下：

{
  "title": "故事标题",
  "description": "一句话简介",
  "tags": ["题材1", "题材2"],
  "startNodeId": "n1",
  "nodes": [
    {
      "id": "n1",
      "type": "start",
      "title": "场景标题",
      "text": "场景正文，要有氛围感和细节，80-200字",
      "speaker": "旁白或角色名(可选)"
    },
    {
      "id": "n2",
      "type": "scene",
      "title": "...",
      "text": "...",
      "speaker": "..."
    },
    {
      "id": "n3",
      "type": "clue",
      "title": "线索标题",
      "text": "发现线索的描述",
      "clueKey": "线索英文标识如rusty_key",
      "clueName": "线索中文名如生锈的钥匙"
    },
    {
      "id": "n4",
      "type": "puzzle",
      "title": "谜题标题",
      "text": "谜题场景描述",
      "puzzleAnswer": "正确答案如4242",
      "puzzlePrompt": "输入提示如请输入密码",
      "puzzleHint": "错误提示"
    },
    {
      "id": "n5",
      "type": "ending",
      "title": "结局标题",
      "text": "结局正文",
      "endingKind": "good"
    }
  ],
  "choices": [
    { "from": "n1", "to": "n2", "label": "选项文字" }
  ],
  "items": [
    { "key": "rusty_key", "name": "生锈的钥匙" }
  ]
}

要求：
1. type 只能是 start / scene / clue / puzzle / ending 之一。
2. 必须有且仅有一个 start 节点，startNodeId 指向它。
3. 至少 ${e} 个 ending 节点，endingKind 为 good / neutral / bad / secret 之一。
4. 节点 id 用 n1, n2, n3... 顺序命名，必须唯一。
5. choices 的 from 和 to 必须引用已存在的节点 id。
6. 从 start 出发必须能到达所有结局，不要有孤立的节点。
7. 谜题节点应配合线索节点：先有线索给出密码，再有谜题要求输入。
8. 选项 label 简短（12字内），有行动感。
9. 剧情要有逻辑、悬念和转折，不要空节点或重复套话。
10. 只返回 JSON，不要任何额外文字或解释。`}function O(e){return!e.enabled||!e.apiKey||!e.endpoint||!e.model?null:new h(e)}function b(e){return!!e.apiKey&&!!e.endpoint&&!!e.model}async function $(e){if(!b(e))return{ok:!1,message:"请填写 Endpoint、模型名称和 API Key。"};const t=new h(e),s=Date.now();try{return await t.chat({model:e.model,messages:[{role:"user",content:"ping"}],max_tokens:1}),{ok:!0,message:`连接成功，模型 ${e.model} 可用。`,latency:Date.now()-s}}catch(n){return{ok:!1,message:n instanceof o?n.message:n.message||"未知错误"}}}export{o as A,O as c,$ as t};
