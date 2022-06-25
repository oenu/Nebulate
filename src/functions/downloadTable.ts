const downloadTable = async (): Promise<any> => {
  try {
    console.log(global.server);
    const response = await fetch(`${global.server}/api/table`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.log(error);
  }
};

export default downloadTable;
