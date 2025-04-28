import discord
from shared import TicketModal, handle_ticket_management
import datetime
from config import load_config

class TicketView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(label="Close Ticket", style=discord.ButtonStyle.green, custom_id="persistent:close_ticket")
    async def close_button(self, interaction: discord.Interaction, button: discord.ui.Button):
        await handle_ticket_management(interaction, "close_ticket")

    @discord.ui.button(label="Delete Ticket", style=discord.ButtonStyle.red, custom_id="persistent:delete_ticket")
    async def delete_button(self, interaction: discord.Interaction, button: discord.ui.Button):
        await handle_ticket_management(interaction, "delete_ticket")

class CreateTicketView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(label="Create Ticket", style=discord.ButtonStyle.blurple, custom_id="persistent:create_ticket")
    async def ticket_button(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_modal(TicketModal())

class TicketModal(discord.ui.Modal, title="Create Support Ticket"):
    reason = discord.ui.TextInput(
        label="Reason for your ticket",
        placeholder="Please describe your issue...",
        style=discord.TextStyle.paragraph,
        required=True
    )

    async def on_submit(self, interaction: discord.Interaction):
        await interaction.response.defer(ephemeral=True)
        reason = self.reason.value

        config = load_config(interaction.guild.id)

        if "ticket_channel" not in config:
            await interaction.followup.send("Ticket system is not set up yet. Ask an admin to run /setup.", ephemeral=True)
            return

        category = interaction.guild.get_channel(config["category"])
        if not category:
            await interaction.followup.send("Ticket category not found.", ephemeral=True)
            return

        for channel in category.channels:
            if isinstance(channel, discord.Thread):
                if channel.name.startswith(f"ticket-{interaction.user.id}"):
                    if not channel.archived:
                        await interaction.followup.send(f"You already have an open ticket: {channel.mention}", ephemeral=True)
                        return
                    else:
                        await channel.unarchive()
                        await channel.send(f"{interaction.user.mention} Ticket reopened with new reason: {reason}")
                        await interaction.followup.send(f"Your existing ticket has been reopened: {channel.mention}", ephemeral=True)
                        return

        try:
            ticket_channel = interaction.guild.get_channel(config["ticket_channel"])
            if not ticket_channel:
                await interaction.followup.send("Ticket channel not found.", ephemeral=True)
                return

            thread = await ticket_channel.create_thread(
                name=f"ticket-{interaction.user.id}-{datetime.datetime.now().strftime('%Y%m%d-%H%M%S')}",
                type=discord.ChannelType.private_thread,
                reason=f"Ticket created by {interaction.user} for: {reason}"
            )

            await thread.add_user(interaction.user)

            if config.get("support_role"):
                support_role = interaction.guild.get_role(config["support_role"])
                if support_role:
                    await thread.send(f"{support_role.mention} New ticket created!")

            embed = discord.Embed(
                title=f"Ticket from {interaction.user.display_name}",
                description=f"**Reason:** {reason}\n\nPlease be patient while waiting for a response.",
                color=discord.Color.green()
            )
            embed.set_footer(text=f"User ID: {interaction.user.id}")

            await thread.send(embed=embed, view=TicketView())
            await interaction.followup.send(f"Your ticket has been created: {thread.mention}", ephemeral=True)

            if config.get("log_channel"):
                log_channel = interaction.guild.get_channel(config["log_channel"])
                if log_channel:
                    log_embed = discord.Embed(
                        title="Ticket Created",
                        description=f"**User:** {interaction.user.mention}\n**Thread:** {thread.mention}\n**Reason:** {reason}",
                        color=discord.Color.green(),
                        timestamp=datetime.datetime.now()
                    )
                    await log_channel.send(embed=log_embed)

        except Exception as e:
            print(f"Error creating ticket: {e}")
            await interaction.followup.send("Failed to create ticket.", ephemeral=True)