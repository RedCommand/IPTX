import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  Text,
  TextInput,
  useColorScheme,
  View,
  FlatList,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';

import {getMaterialYouCurrentTheme} from '../utils/theme';
import {MovieDTO} from '../dto/media/movie.dto';
import {retrieveData} from '../utils/data';
import {retrieveCategoryInfo} from '../utils/retrieveInfo';
import {MediaType} from '../utils/MediaType';
import {useIsFocused} from '@react-navigation/native';
import {SeriesDTO} from '../dto/media/series.dto';
import {Card} from 'react-native-paper';
import {getFlagEmoji} from '../utils/flagEmoji';
import {LiveDTO} from '../dto/media/live.dto';
import {globalVars} from '../App';
import {buildURL} from '../utils/buildUrl';

function SearchScreen({navigation}: any): React.JSX.Element {
  const CHUNK_SIZE = 10;

  const [series, setSeries] = useState<SeriesDTO[]>([]);
  const [movies, setMovies] = useState<MovieDTO[]>([]);
  const [tvChannels, setTvChannels] = useState<LiveDTO[]>([]);
  const [profile, setProfile] = useState<string | null>('');
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [visibleSearchResults, setVisibleSearchResults] = useState<any[]>([]);
  const isDarkMode = useColorScheme() === 'dark';
  const [input, setInput] = useState<string>('');
  const [numLoaded, setNumLoaded] = useState(CHUNK_SIZE);

  let theme = getMaterialYouCurrentTheme(isDarkMode);

  const focused = useIsFocused();

  useEffect(() => {
    retrieveData('name').then(name => {
      if (movies.length === 0 || name !== profile) {
        setMovies([]);
        setSeries([]);
        setProfile(name);
        retrieveCategoryInfo(MediaType.LIVE).then(data => {
          setTvChannels(data);
          retrieveCategoryInfo(MediaType.MOVIE).then(data => {
            setMovies(data);
            retrieveCategoryInfo(MediaType.SERIES).then(data => {
              setSeries(data);
              setLoading(false);
              return;
            });
          });
        });
      } else {
        console.log('Categories already loaded');
      }
    });
  }, [focused]);

  useEffect(() => {
    setVisibleSearchResults(searchResults.slice(0, numLoaded));
  }, [searchResults, numLoaded]);

  useEffect(() => {
    console.log('input', input);
    const searchInput = input.trim().toLowerCase();
    const filteredTvChannels = tvChannels.filter(item =>
      item.name?.toLowerCase().includes(searchInput),
    );

    const filteredSeries = series.filter(
      item =>
        item.name?.toLowerCase().includes(searchInput) ||
        item.cast?.toLowerCase().includes(searchInput) ||
        item.director?.toLowerCase().includes(searchInput) ||
        item.genre?.toLowerCase().includes(searchInput) ||
        item.tmdb?.toLowerCase().includes(searchInput) ||
        item.plot?.toLowerCase().includes(searchInput),
    );

    const filteredMovies = movies.filter(item =>
      item.name?.toLowerCase().includes(searchInput),
    );

    const results = [
      ...filteredTvChannels,
      ...filteredMovies,
      ...filteredSeries,
    ];

    setSearchResults(results);
  }, [input, series, movies]);

  const handleLoadMore = () => {
    // const currentLength = visibleSearchResults.length;
    // const nextChunk = searchResults.slice(currentLength, currentLength + CHUNK_SIZE);
    // setVisibleSearchResults([...visibleSearchResults, ...nextChunk]);
    console.log('Loading more: ', numLoaded);
    setNumLoaded(numLoaded + CHUNK_SIZE);
  };

  const renderItem = ({item}: {item: MovieDTO | SeriesDTO}) => {
    var flag = item.name.split(' ')[0];
    var name = item.name.split(' ').slice(1).join(' ');
    if (flag.length < 2) {
      flag = item.name.split(' ')[1];
      name = item.name.split(' ').slice(2).join(' ');
    }
    flag = getFlagEmoji(flag);

    return (
      <Card
        key={item.id}
        style={{backgroundColor: theme.card}}
        className={'rounded-lg w-44 h-[17rem] relative flex flex-col'}
        onPress={async () => {
          if (item.type === MediaType.SERIES)
            navigation.push('SeriesView', {series: item});
          else if (item.type === MediaType.MOVIE)
            navigation.push('MovieView', {movie: item});
          else if (item.type === MediaType.LIVE) {
            const videoUrl = await buildURL(MediaType.LIVE, item.stream_id);
            globalVars.isPlayer = true;
            navigation.push('Player', {url: videoUrl, name: item.name});
          }
        }}>
        <View>
          <Card.Title
            className="flex-initial"
            title={item.name}
            titleStyle={{
              color: theme.text,
              fontSize: 12,
              marginVertical: 10,
            }}
            titleNumberOfLines={1}
          />
        </View>
        <View className="items-center">
          <Card.Cover
            source={{
              uri:
                item.stream_icon != ''
                  ? item.stream_icon
                  : 'https://cdn.dribbble.com/users/2639810/screenshots/9403030/media/d1c8b21cbd1972075ea236b1953f884f.jpg',
            }}
            style={{
              resizeMode: 'stretch',
              width: 130,
              height: 172,
              borderRadius: 6,
              justifyContent: 'center',
              position: 'relative',
              marginTop: 4,
            }}
            resizeMethod="auto"
          />
        </View>
      </Card>
    );
  };

  const windowWidth = useWindowDimensions().width;
  const numColumns = Math.floor(windowWidth / 180);

  return (
    <SafeAreaView style={{backgroundColor: theme.background}}>
      {/* <ScrollView
        horizontal={false}
        contentInsetAdjustmentBehavior="automatic"
        style={{backgroundColor: theme.background}}> */}
      <View
        // className="flex-1 flex-col h-full"
        style={{
          backgroundColor: theme.background,
          display: 'flex',
          flexDirection: 'row',
        }}>
        <View className="flex-1 flex-col justify-center items-center w-full">
          <View className="w-10/12 m-2 pt-2 justify-center flex flex-col">
            <View className="rounded-lg">
              <Text
                className="text-2xl p-4 font-bold items-start"
                style={{
                  color: theme.primary,
                }}>
                Search
              </Text>
              <TextInput
                className="w-full p-2 rounded-lg"
                autoCorrect={false}
                style={{
                  backgroundColor: theme.card,
                  color: theme.text,
                }}
                placeholderTextColor={theme.secondary}
                placeholder="Search..."
                onKeyPress={e => {
                  if (e.nativeEvent.key === 'Backspace') {
                    setInput(input.slice(0, -1));
                  } else if (e.nativeEvent.key !== 'Enter') {
                    setInput(input + e.nativeEvent.key);
                  }
                }}
                numberOfLines={1}
                onChangeText={text => setInput(text)}
              />
            </View>
          </View>
        </View>
      </View>
      <View>
        {loading ? (
          <View className="flex-1 pb-4 items-center justify-center align-middle">
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <FlatList
            key={numColumns}
            numColumns={numColumns}
            data={visibleSearchResults}
            renderItem={renderItem}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.1}
            keyExtractor={item => item.id.toString()}
            columnWrapperStyle={{gap: 7}}
            contentContainerStyle={{
              justifyContent: 'center',
              alignItems: 'center',
              gap: 7,
            }}
            ListEmptyComponent={
              <Text style={{color: theme.text, textAlign: 'center'}}>
                No results found
              </Text>
            }
          />
        )}
      </View>
      {/* </ScrollView>r */}
    </SafeAreaView>
  );
}

export default SearchScreen;
