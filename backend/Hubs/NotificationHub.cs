using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;

namespace Ascension.Api.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    // Called automatically when a client connects
    public override async Task OnConnectedAsync()
    {
        // Add this connection to a group named after the player's ID
        // so we can send messages to a specific player later
        var playerId = Context.UserIdentifier;
        if (playerId != null)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, playerId);
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var playerId = Context.UserIdentifier;
        if (playerId != null)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, playerId);
        }
        await base.OnDisconnectedAsync(exception);
    }
}