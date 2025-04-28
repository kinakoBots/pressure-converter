import discord
from discord.ext import commands
import os
from views import CreateTicketView, TicketView
from utils import setup as setup_commands

class TicketBot(commands.Bot):
    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True
        intents.members = True
        intents.guilds = True
        intents.messages = True

        super().__init__(command_prefix="!", intents=intents)
        self.persistent_views_added = False

    async def setup_hook(self):
        await setup_commands(self)

        if not self.persistent_views_added:
            self.add_view(CreateTicketView())
            self.add_view(TicketView())
            self.persistent_views_added = True

    async def on_ready(self):
        print(f'Logged in as {self.user.name} ({self.user.id})')
        print("Syncing commands...")
        await self.tree.sync()
        print("Commands synced!")
        await self.change_presence(activity=discord.Activity(type=discord.ActivityType.watching, name="for tickets"))

if __name__ == "__main__":
    bot = TicketBot()
bot.run(os.getenv("DISCORD_TOKEN"))
