import discord
import datetime
from discord import app_commands
from config import load_config, save_config
from shared import TicketModal

async def setup(bot):
    @bot.tree.command(name="sync", description="Sync all slash commands")
    @app_commands.default_permissions(administrator=True)
    async def sync(interaction: discord.Interaction):
        await interaction.response.defer(ephemeral=True)
        await bot.tree.sync()
        await interaction.followup.send("Commands synced!", ephemeral=True)
    @bot.tree.command(name="setup", description="Set up the ticket system")
    @app_commands.default_permissions(administrator=True)
    async def setup_command(
        interaction: discord.Interaction,
        category: discord.CategoryChannel = None,
        support_role: discord.Role = None,
        log_channel: discord.TextChannel = None
    ):
        await interaction.response.defer(ephemeral=True)
        config = load_config(interaction.guild.id)

        if category is None:
            category = await interaction.guild.create_category("Tickets")

        ticket_channel = discord.utils.get(interaction.guild.text_channels, name="create-ticket")
        if ticket_channel is None:
            ticket_channel = await interaction.guild.create_text_channel(
                "create-ticket",
                category=category,
                topic="Create a ticket by clicking the button below"
            )

        embed = discord.Embed(
            title="Need help?",
            description="Click the button below to create a new ticket!",
            color=discord.Color.blurple()
        )

        from views import CreateTicketView
        await ticket_channel.purge(limit=10)
        await ticket_channel.send(embed=embed, view=CreateTicketView())

        config.update({
            "ticket_channel": ticket_channel.id,
            "category": category.id,
            "support_role": support_role.id if support_role else None,
            "log_channel": log_channel.id if log_channel else None
        })

        save_config(interaction.guild.id, config)
        success_message = discord.Embed(
            description="Ticket system has been set up successfully",
            color=int('0d1627', 16)
        )
        await interaction.followup.send(embed=success_message, ephemeral=True)

    @bot.tree.command(name="ticket", description="Create a support ticket")
    async def ticket_command(interaction: discord.Interaction):
        await interaction.response.send_modal(TicketModal())

    @bot.tree.command(name="add", description="Add a user to the current ticket")
    async def add_user_to_ticket(interaction: discord.Interaction, user: discord.Member):
        """Adds a user to the current ticket thread"""
        await interaction.response.defer(ephemeral=True)

        # Check if this is a ticket thread
        if not isinstance(interaction.channel, discord.Thread):
            await interaction.followup.send("❌ This command is only usable in tickets threads.", ephemeral=True)
            return

        config = load_config(interaction.guild.id)
        has_permission = False

        # Check if user is the ticket owner
        thread_name_parts = interaction.channel.name.split('-')
        if len(thread_name_parts) >= 2 and thread_name_parts[1].isdigit():
            ticket_owner_id = int(thread_name_parts[1])
            if interaction.user.id == ticket_owner_id:
                has_permission = True

        # Check support role
        if not has_permission and config.get("support_role"):
            support_role = interaction.guild.get_role(config["support_role"])
            if support_role and support_role in interaction.user.roles:
                has_permission = True

        # Check admin permissions
        if not has_permission and interaction.user.guild_permissions.administrator:
            has_permission = True

        if not has_permission:
            await interaction.followup.send("❌ not enough permissions.", ephemeral=True)
            return

        try:
            # Check if user is already in the thread
            if user.id in [member.id for member in interaction.channel.members]:
                await interaction.followup.send(f"🤔 {user.mention} is already in this ticket.", ephemeral=True)
                return

            # Add the user to the thread
            await interaction.channel.add_user(user)

            # Send confirmation messages
            await interaction.followup.send(f"✅ I have added {user.mention} to the ticket.", ephemeral=True)
            await interaction.channel.send(
                f"I have added {user.mention} to this ticket by {interaction.user.mention}."
            )

            # Log the addition if log channel is set up
            if config.get("log_channel"):
                log_channel = interaction.guild.get_channel(config["log_channel"])
                if log_channel:
                    log_embed = discord.Embed(
                        title="User Added to Ticket",
                        description=(
                            f"**Thread:** {interaction.channel.mention}\n"
                            f"**Added by:** {interaction.user.mention}\n"
                            f"**User added:** {user.mention}"
                        ),
                        color=discord.Color.blue(),
                        timestamp=datetime.datetime.now()
                    )
                    await log_channel.send(embed=log_embed)

        except discord.Forbidden:
            await interaction.followup.send("❌ I don't have permission to add users to this thread.", ephemeral=True)
        except discord.HTTPException as e:
            print(f"Error adding user to ticket: {e}")
            await interaction.followup.send("❌ Failed to add user to the ticket. Please try again later.", ephemeral=True)