import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getMaterialYouCurrentTheme } from '../utils/theme';
import { retrieveCategories } from '../utils/retrieveInfo';
import { MediaType } from '../utils/MediaType';
import { CategoryDTO } from '../dto/category.dto';
import { getFlagEmoji } from '../utils/flagEmoji';
import { useIsFocused } from '@react-navigation/native';
import { retrieveData, storeData } from '../utils/data';

function MoviesScreen({navigation}: any): React.JSX.Element {
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [profile, setProfile] = useState<string | null>('');
  const [editMode, setEditMode] = useState(false);
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);
  const isDarkMode = useColorScheme() === 'dark';

  let theme = getMaterialYouCurrentTheme(isDarkMode);

  const focused = useIsFocused();

  useEffect(() => {
    retrieveData('name').then((name) => {
      if (categories.length === 0 || name !== profile) {
        setCategories([]);
        setProfile(name);
        retrieveCategories(MediaType.MOVIE).then((data) => {
            setCategories(data);
            return;
        });
      } else {
        console.log('Categories already loaded');
      }
    });

    retrieveData('hiddenCategoriesMovies').then((data) => {
      const hiddenCategories = JSON.parse(data || '[]');
      setHiddenCategories(Array.isArray(hiddenCategories) ? hiddenCategories : []);
    });
  }, [focused]);

  const toggleEditMode = () => {
    if (editMode) {
      storeData('hiddenCategoriesMovies', [...hiddenCategories]);
    }
    setEditMode(!editMode);
  };

  const hideCategory = (id: string) => {
    setHiddenCategories((prevHiddenCategories) => [...prevHiddenCategories, id]);
  };

  const showCategory = (id: string) => {
    setHiddenCategories((prevHiddenCategories) => prevHiddenCategories.filter(categoryId => categoryId !== id));
  };

  const visibleCategories = categories.filter(category => !hiddenCategories.includes(category.id));
  const hiddenCategoriesList = categories.filter(category => hiddenCategories.includes(category.id));

  return (
    <SafeAreaView style={{backgroundColor: theme.background}}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{backgroundColor: theme.background}}>
        <View
          className='flex-1 flex-col h-full'
          style={{
            backgroundColor: theme.background,
          }}>
          <View className='flex-row justify-between items-center p-4'>
            <Text className='text-2xl font-bold' style={{ color: theme.primary }}>Movies</Text>
            <TouchableOpacity onPress={toggleEditMode}>
              <MaterialCommunityIcons name={editMode ? "check" : "pencil"} size={24} color={theme.primary} />
            </TouchableOpacity>
          </View>
          <View className='flex-1 flex-col justify-center items-center w-full'>
            {visibleCategories.map((category) => {
              var flag = category.name.split(' ')[0];
              flag = getFlagEmoji(flag);
              var name = category.name.split(' ').slice(1).join(' ');
              return (
                <View key={category.id} className='w-10/12 h-10 m-2 p-2 flex-row justify-between items-center' style={{ backgroundColor: theme.card }}>
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() =>
                      !editMode && navigation.push('Category', {
                        category: category,
                      })
                    }
                  >
                    <Text style={{ color: theme.text, textAlign: 'center' }}>
                      {flag} {name}
                    </Text>
                  </TouchableOpacity>
                  {editMode && (
                    <TouchableOpacity onPress={() => hideCategory(category.id)}>
                      <MaterialCommunityIcons name="delete" size={24} color={theme.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
            {hiddenCategoriesList.length > 0 && editMode && (
              <View style={{ width: '100%', padding: 10, alignItems: 'center' }}>
                <Text style={{ color: theme.primary, textAlign: 'center', marginBottom: 10 }}>Hidden Categories</Text>
                {hiddenCategoriesList.map((category) => {
                  var flag = category.name.split(' ')[0];
                  flag = getFlagEmoji(flag);
                  var name = category.name.split(' ').slice(1).join(' ');
                  return (
                    <View key={category.id} className='w-10/12 h-10 m-2 p-2 flex-row justify-between items-center' style={{ backgroundColor: theme.card }}>
                      <Text style={{ color: theme.text, textAlign: 'center', flex: 1 }}>
                        {flag} {name}
                      </Text>
                      {editMode && (
                        <TouchableOpacity onPress={() => showCategory(category.id)}>
                          <MaterialCommunityIcons name="undo" size={24} color={theme.primary} />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default MoviesScreen;