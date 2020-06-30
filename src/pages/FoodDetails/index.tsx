import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format, check } from 'prettier';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      const { data } = await api.get<Food>(`foods/${routeParams.id}`);
      const formattedFood: Food = {
        ...data,
        formattedPrice: formatValue(data.price),
      };

      setFood(formattedFood);

      // extras
      setExtras(
        data.extras.map(extra => ({
          ...extra,
          quantity: 0,
        })),
      );

      // checar se é favorito
      const favorites = await api.get('favorites');
      const checkIsFavorite = favorites.data.find(
        favorite => favorite.id === routeParams,
      );
      if (checkIsFavorite !== undefined) {
        setIsFavorite(true);
      }
    }

    loadFood();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    const index = extras.findIndex(p => p.id === id);
    if (index >= 0) {
      const incrementExtra = [...extras];
      incrementExtra[index] = {
        ...extras[index],
        quantity: extras[index].quantity + 1,
      };
      setExtras(incrementExtra);
    }
  }

  function handleDecrementExtra(id: number): void {
    const index = extras.findIndex(p => p.id === id);
    if (index >= 0) {
      if (extras[index].quantity === 0) {
        return;
      }

      const decrementExtra = [...extras];
      decrementExtra[index] = {
        ...extras[index],
        quantity: extras[index].quantity - 1,
      };
      setExtras(decrementExtra);
    }
  }

  function handleIncrementFood(): void {
    const value = foodQuantity + 1;
    setFoodQuantity(value);
  }

  function handleDecrementFood(): void {
    if (foodQuantity === 1) {
      return;
    }

    const value = foodQuantity - 1;
    setFoodQuantity(value);
  }

  const toggleFavorite = useCallback(() => {
    if (!isFavorite) {
      api.post('favorites', food);
      setIsFavorite(true);
    } else {
      api.delete(`favorites/${food.id}`);
      setIsFavorite(false);
    }
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    const maps = extras.map(item => item.quantity * item.value);
    if (extras.length > 1) {
      const extraValue = maps.reduce((a, b) => {
        return a + b;
      }, 0);

      return foodQuantity * (food.price + extraValue);
    }
    return foodQuantity * food.price + maps[0];
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    const order = {
      product_id: food.id,
      name: food.name,
      description: food.description,
      price: cartTotal,
      thumbnail_url: food.image_url,
      extras,
    };
    api.post('orders', order);
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">
              {formatValue(cartTotal)}
            </TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
