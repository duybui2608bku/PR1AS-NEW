# Test Realtime trong Browser Console

## Cách test nhanh

Mở browser console của **user 2** (người nhận) và chạy code sau:

```javascript
// Test Realtime subscription KHÔNG filter
const conversationId = '281326d8-1979-4004-9234-4ca75ac3a5e9'; // Thay bằng conversation ID thực tế

// Lấy Supabase client (adjust path nếu cần)
const supabase = window.__SUPABASE_CLIENT__ || 
  (await import('/lib/supabase/client.js')).createClient();

console.log('🧪 Testing Realtime WITHOUT filter...');
console.log('   Conversation ID:', conversationId);

const channelNoFilter = supabase
  .channel(`test-no-filter-${Date.now()}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    // KHÔNG có filter
  }, (payload) => {
    console.log('📨 NO FILTER: Event received!', payload);
    console.log('   Conversation ID:', payload.new?.conversation_id);
    if (payload.new?.conversation_id === conversationId) {
      console.log('✅ ✅ ✅ SUCCESS! This is the right conversation!');
    }
  })
  .subscribe((status) => {
    console.log('📡 NO FILTER Status:', status);
    if (status === 'SUBSCRIBED') {
      console.log('✅ Subscribed! Now send a message from user 1...');
    }
  });

console.log('💡 Send a message from user 1 and watch for events...');
```

## Hoặc sử dụng cách đơn giản hơn

Nếu import không hoạt động, sử dụng cách này:

1. Mở browser console
2. Tìm một component đang sử dụng `useSupabaseRealtime`
3. Hoặc tạo subscription trực tiếp:

```javascript
// Copy code này vào console
(async () => {
  // Import createClient
  const module = await import('/lib/supabase/client.js');
  const { createClient } = module;
  const supabase = createClient();
  
  const conversationId = '281326d8-1979-4004-9234-4ca75ac3a5e9';
  
  console.log('🧪 Testing Realtime...');
  
  // Test không filter
  const ch1 = supabase
    .channel(`test-1-${Date.now()}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
    }, (p) => {
      console.log('📨 NO FILTER:', p.new);
    })
    .subscribe();
  
  // Test có filter
  const ch2 = supabase
    .channel(`test-2-${Date.now()}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`,
    }, (p) => {
      console.log('📨 WITH FILTER:', p.new);
    })
    .subscribe();
  
  console.log('✅ Subscriptions created. Send a message from user 1...');
})();
```

## Kết quả mong đợi

- Nếu **NO FILTER** nhận được events → Vấn đề với filter hoặc RLS
- Nếu **NO FILTER** cũng không nhận được → Vấn đề với Realtime setup cơ bản

