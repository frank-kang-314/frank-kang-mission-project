def letter_to_number(input_string):
    if input_string.isnumeric():
        return int(input_string)
    elif input_string == "Q":
        return 12
    elif input_string == "J": 
        return 11
    elif input_string == "T":
        return 10
    elif input_string == "A":
        return 1
    elif input_string == "K":
        return 13
        

def are_opposites(color1, color2):
    list_opposites = [["C","H"], ["C", "D"], ["S", "H"], ["S", "D"]]
    if [color1, color2] in list_opposites or [color2, color1] in list_opposites:
        return True
    return False

def player_turn(player_num, hands, draw_pile, pile):
    player_hand = hands[player_num]
    
    has_played_cards_this_turn = False
    has_played_cards_this_loop = False
    
    while True: #Each time a card is played, repeat the loop
        do_not_end = False
        has_played_cards_this_loop = False
        print("---------------------------------Starting new main loop---------------------------------------")
        for card in player_hand: #Goes through each card in the player's hand once
            #Check if this specific card can be played
            print(f"===================Checking the card in the player's hand: {card}====================")
            if card[0] == "K":
                for i in range(0,4):
                    if pile[2 * i + 1] == "E":
                        pile[2 * i + 1] = card
                        print("King Card added to pile.")
                        print(f"Pile is now {pile}")
                        player_hand.remove(card)
                        print(f"Hand is now {player_hand}")
                        has_played_cards_this_turn = True
                        has_played_cards_this_loop = True
                        break
            else: 
                for i in range(0,8):
                    if pile[i] != "E":
                        if are_opposites(pile[i][1], card[1]) and letter_to_number(card[0]) == letter_to_number(pile[i][0]) - 1:
                            pile[i] = card
                            print("Card added to pile.")
                            print(f"Pile is now {pile}")
                            player_hand.remove(card)
                            print(f"Hand is now {player_hand}") 
                            has_played_cards_this_turn = True
                            has_played_cards_this_loop = True
                            break
            if has_played_cards_this_loop:
                print("Already played a card, go back to the start of the hand")
                do_not_end = True
                break
        if not do_not_end:
            break
    
    if draw_pile:
        player_hand.append(draw_pile[0])
        print(f"Added card {draw_pile[0]} to hand.")
        print(f"Hand is now {player_hand}")
        draw_pile.pop(0)
        print(f"Draw pile is now {draw_pile}")
    
    hands[player_num] = player_hand
        
    return hands, draw_pile, pile, has_played_cards_this_turn

def playGame(hand1, hand2, pile):
    # Write your code here
    hand1 = hand1.split()
    hand2 = hand2.split()
    hands = {
        1: hand1,
        2: hand2
    }
    draw_pile = pile.split()
    piles = ["E"] * 8 #Note: piles starts from top middle pile
    for i in range(4):
        piles[2 * i] = draw_pile[0]
        draw_pile.pop(0)
    
    print(f"Starting piles: {piles}")
    
    while True:
        has_played_cards_this_turn = [False,False]
        print("STARTING PLAYER 1 TURN")
        hands, draw_pile, piles, has_played_cards_this_turn[0] = player_turn(1, hands, draw_pile, piles)
        print("ENDING PLAYER 1 TURN, BEGINNING PLAYER 2 TURN")
        hands, draw_pile, piles, has_played_cards_this_turn[1] = player_turn(2, hands, draw_pile, piles)
        print("ENDING PLAYER 2 TURN, RESTARTING?")
        print(f"Has player 1 played a card this turn: {has_played_cards_this_turn[0]}")
        print(f"Has player 2 played a card this turn: {has_played_cards_this_turn[1]}")
        print(f"Is draw pile empty: {draw_pile == []}")
        if not has_played_cards_this_turn[0] and not has_played_cards_this_turn[1] and draw_pile == []:
            print("GAME OVER")
            break

    return " ".join(piles)

print(playGame("AD 5C 2S TH 2H 3C QS",
"6S 9D 8H KH TD KS 5D",
"JH 7D QH 3D 7H 2C 6H 8C QD JC 4S AC AS 9C 7S JS 3S 8D AH 8S 4D 6C"))