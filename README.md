# 🏆FIFA World Cup 2026 Sweepstakes Tracker🏆

## Introduction
I am involved in a FIFA World Cup 2026 sweepstake with some old friends. In total, there are 7 players.

This analysis aims to evaluate the value of each player's position as the tournament unfolds using odds from [Polymarket](https://polymarket.com).

## Draw Rules
Buy-in was set at £20, for a total prize fund of £140.\
The champion prize is £120.\
The runner-up prize is £20.

48 teams will contest the World Cup.

Teams were ranked 1-48 based on the subjective opinion of the friend arranging the sweepstakes. This friend, despite his many virtues, would be well advised not to abandon his day job in pursuit of football punditry.

The top 7 teams were assigned to pot 1, the next seven were assigned to pot 2, and so on. This continued for 6 pots, a total of 42 teams.

Teams were then drawn at random such that each player was assigned 1 team from each pot. The remaining 8 teams have vanishingly small odds of contesting the tournament's latter stages and are assigned to "neb". In the unlikely scenario that "neb" wins a prize, that prize will be split equally among the 7 players.

The player who drew the team that becomes champion wins the champion prize. Runner-up will be paid in the same way.
If a player owns both the champion and runner-up, they win both prizes.

## Strategy
1. Odds to **win** and **reach the final** are retrieved from Polymarket.
2. The implied probabilities of each team becoming champion are summed and normalised against 1 to remove the effect of market spread.
3. The implied probabilities of each team reaching the final are summed and normalised against 2 (2 teams will contest the final) to remove the effect of market spread.
4. The implied probabilities of each team becoming runner-up are calculated as the probability of reaching the final less the probability of becoming champion.
5. The probability that a player will hold the champion team is the sum of the probabilities of all the teams they hold becoming champions. The value of their stake from the perspective of winning the champion prize is then calculated as the expected value (overall probability x prize value). Total stake value is calculated as their champion value plus their runner-up value.
6. A workflow is executed periodically to retrieve the most current odds data.
7. A chart hosted on GitHub Pages illustrates the value of each player's stake over time.

<div align="center">

<i>Lleucu Llwyd, rwyt ti'n hardd,</i><br>
<i>Lleucu Llwyd rwyt ti'n werth y byd i mi.</i><br>
<i>Lleucu Llwyd, rwyt ti'n angel,</i><br>
<i>Lleucu Llwyd rwy'n dy garu di o hyd.</i><br>

</div>
