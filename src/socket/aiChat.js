import Chat from "../models/Chat.js";
import Message from "../models/Message.js";

// Initialize OpenAI with your API key

let ai=async(content)=>{
    
   let res=await  fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer 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",
          "HTTP-Referer": "https://chatingfightserver.onrender.com", // Optional. Site URL for rankings on openrouter.ai.
          "X-Title": "chatfight", // Optional. Site title for rankings on openrouter.ai.
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "deepseek/deepseek-v3-base:free",
          "messages": [
            {
              "role": "user",
              "content": content
            }
          ]
        })
      });
      let data=await res.json();
      console.log(data);
      
      return data?.choices[0]?.message?.content;
}

let aiChat = async (socket, content, id, chatId) => {
    try {
        // Save user message
        let message = await Message.create({
            content: content,
            chat: chatId,
            createdBy: id,
            ai: false
        });
        
        message = await Message.findById(message._id).populate("createdBy", "name _id avatar");
        socket.emit("message-recieved", { message: message, createdBy: id });
        // Send user message to OpenAI and get a response

        // Save AI response
        let aiMessage=await ai(content);
        let response = await Message.create({
            content: aiMessage,
            chat: chatId,
            createdBy: id,
            ai: true
        });
        // Populate user and AI messages
        response = await Message.findById(response._id).populate("createdBy", "name _id avatar");

        // Update chat history
        let chat = await Chat.findById(chatId);
        chat.message.push(message._id);
        chat.message.push(response._id);
        await chat.save();

        // Emit messages to client
        socket.emit("message-recieved", { message: response, createdBy: id });

    } catch (error) {
        console.error("Error in AI chat:", error);
        socket.emit("message-error", { error: "Failed to process AI response." });
    }
};

export { aiChat };
